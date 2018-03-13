// handle sending email notifications in response to a new post

'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Indexes = require('./indexes');
const PostRenderer = require('./post_renderer');
const EmailNotificationRenderer = require('./email_notification_renderer');
const SessionManager = require(process.env.CS_API_TOP + '/modules/users/session_manager');

// make jshint happy
/* globals Intl */

class EmailNotificationSender {

	constructor (options) {
		Object.assign(this, options);
	}

	// send email notifications for a new post to all members that are not
	// currently online for the repo and the team
	sendEmailNotifications (callback) {
		if (!this.stream || this.stream.get('type') !== 'file') {
			// for now, not sending notifications for non-file type streams
			return callback();
		}
		BoundAsync.series(this, [
			this.getTeam,					// get the team that owns the stream that owns the post
			this.getRepo,					// get the repo that owns the stream that owns the post
			this.getAllMembers,				// get all members of the team
			this.getRepoSubscribedMembers,	// get users who are subscribed to the repo channel
			this.getTeamSubscribedMembers,	// get users who are subscribed to the team channel
			this.getOfflineMembers,			// get offline members: those who are not subscribed to the repo channel
			this.filterByPreference,		// filter to those who haven't turned email notifications off
			this.getPosts,					// get the most recent posts in the stream
			this.getParentPosts,			// get the parent post if this is a reply
			this.getPostCreators,			// get the creators of all the posts
			this.renderPosts,				// render the HTML for each post needed
			this.determinePostsPerUser,		// determine which users get which posts
			this.personalizePerUser,		// personalize the rendered posts as needed
			this.renderPerUser,				// render each user's email
			this.sendNotifications,			// send out the notifications`
			this.updateFirstEmails			// update "firstEmail" flags, indicating who has received their first email notification
		], error => {
			if (error === true) {
				// no emails were necessary
				return callback();
			}
			else if (error) {
				return callback(error);
			}
			else {
				// return the last post in sequence for which an email was sent
				// (which is the first post in this array)
				return callback(null, this.posts[0]);
			}
		});
	}

	// get the team that owns the stream that owns the post
	getTeam (callback) {
		this.request.data.teams.getById(
			this.stream.get('teamId'),
			(error, team) => {
				if (error) { return callback(error); }
				this.team = team;
				callback();
			}
		);
	}

	// get the repo that owns the stream that owns the post
	getRepo (callback) {
		this.request.data.repos.getById(
			this.stream.get('repoId'),
			(error, repo) => {
				if (error) { return callback(error); }
				this.repo = repo;
				callback();
			}
		);
	}

	// get all members of the team
	getAllMembers (callback) {
		this.request.data.users.getByIds(
			this.team.get('memberIds'),
			(error, members) => {
				if (error) { return callback(error); }
				// we don't care about deactivated members
				this.allMembers = members.filter(member => {
					return !member.get('deactivated');
				});
				process.nextTick(callback);
			}
		);
	}

	// get the team members that are currently subscribed to the repo channel for the
	// repo to which the stream belongs
	getRepoSubscribedMembers (callback) {
		// query the messager service (pubnub) for who is subscribed to the team channel
		let channel = 'repo-' + this.repo.id;
		this.request.api.services.messager.getSubscribedUsers(
			channel,
			(error, userIds) => {
				if (error) {
					return callback(`Unable to obtain subscribed users for channel ${channel}: ${error}`);
				}
				this.onlineUserIdsForRepo = userIds;
				this.request.log(`These users are online for repo ${this.repo.id}: ${this.onlineUserIdsForRepo}`);
				callback();
			},
			{
				request: this.request
			}
		);
	}

	// get the team members that are currently subscribed to the team channel (they are online)
	getTeamSubscribedMembers (callback) {
		// query the messager service (pubnub) for who is subscribed to the team channel
		let channel = 'team-' + this.team.id;
		this.request.api.services.messager.getSubscribedUsers(
			channel,
			(error, userIds) => {
				if (error) {
					return callback(`Unable to obtain subscribed users for channel ${channel}: ${error}`);
				}
				this.onlineUserIdsForTeam = userIds;
				this.request.log(`These users are online for team ${this.team.id}: ${this.onlineUserIdsForTeam}`);
				callback();
			}
		);
	}

	// get the user objects for the offline members
	getOfflineMembers (callback) {
		this.offlineMembers = this.allMembers.filter(member => {
			// if they show as offline according to pubnub, they are truly offline
			if (!this.onlineUserIdsForRepo.includes(member.id)) {
				return true;
			}
			const isActive = new SessionManager({
				user: member,
				request: this.request
			}).hasActiveSession();
			return !isActive;
		});
		process.nextTick(callback);
	}

	// filter the offline members to those who haven't turned email notifications off
	filterByPreference (callback) {
		this.needPostsFromSeqNum = -1;
		this.toReceiveEmails = this.offlineMembers.filter(user => this.userWantsEmail(user));
		if (this.toReceiveEmails.length === 0) {
			return callback(true);	// short-circuit the flow
		}
		// record whether all the users to receive emails are in the same timezone,
		// if they are, then we don't need to personalize the rendering of each email,
		// since we can make all the timestamps the same
		const firstUser = this.toReceiveEmails[0];
		this.hasMultipleTimeZones = this.toReceiveEmails.find(user => user.get('timeZone') !== firstUser.get('timeZone'));
		process.nextTick(callback);
	}

	// determine whether the givenn user wants an email notification for the current post
	userWantsEmail (user) {
		const lastReadSeqNum = user.get('lastReads') && user.get('lastReads')[this.stream.id];
		if (typeof lastReadSeqNum === 'undefined') {
			// don't send an email if the user has read everything already
			this.request.log(`User ${user.id} is already caught up on this stream`);
			return false;
		}
		// note that we assume the user is mentioned in the posts ... we don't have the posts yet
		// (and we don't know which ones to get until we know which users want emails), so we are
		// optimistic that the user will want a notification ... then, after we get the posts, we
		// can filter down to those users who really want an email based on mentions
		let wantsEmail = user.wantsEmail(this.stream, true);
		if (wantsEmail) {
			// we'll keep track of the earliest post we need, so we only need fetch from that post forward
			if (
				(
					this.needPostsFromSeqNum === -1 ||
					lastReadSeqNum < this.needPostsFromSeqNum
				) &&
				lastReadSeqNum >= this.seqNum
			) {
				this.needPostsFromSeqNum = lastReadSeqNum;
			}
			else if (lastReadSeqNum < this.seqNum) {
				this.needPostsFromSeqNum = this.seqNum;
			}
		}
		else {
			this.request.log(`User ${user.id} has email notifications turned off for this stream`);
		}
		return wantsEmail;
	}

	// get the most recent posts in the stream, by sequence number
	getPosts (callback) {
		const query = {
			streamId: this.stream.id,
			seqNum: { $gte: this.needPostsFromSeqNum }
		};
		this.request.data.posts.getByQuery(
			query,
			(error, posts) => {
				if (error) { return callback(error); }
				this.posts = posts;
				if (this.posts.length === 0) {
					return callback(true);	// short-circuits when there are no posts
				}
				const firstPost = posts[0];
				// record whether we have multiple authors represented in the posts
				this.hasMultipleAuthors = this.posts.find(post => post.get('creatorId') !== firstPost.get('creatorId'));
				process.nextTick(callback);
			},
			{
				databaseOptions: {
					sort: { seqNum: -1 },
					limit: this.request.api.config.email.maxPostsPerEmail,
					hint: Indexes.bySeqNum
				}
			}
		);
	}

	// get the parent post to any post in the array of posts to go in the email notification,
	// for those posts that are replies
	getParentPosts (callback) {
		const parentPostIds = this.posts.reduce((ids, post) => {
			if (post.get('parentPostId')) {
				ids.push(post.get('parentPostId'));
			}
			return ids;
		}, []);
		if (parentPostIds.length === 0) {
			return callback(); // no replies!
		}
		this.request.data.posts.getByIds(
			parentPostIds,
			(error, parentPosts) => {
				if (error) { return callback(error); }
				this.parentPosts = parentPosts;
				callback();
			}
		);
	}

	// get the creator of the post, if it is a single post
	getPostCreators (callback) {
		const creatorIds = this.posts.reduce((ids, post) => {
			if (!ids.includes(post.get('creatorId'))) {
				ids.push(post.get('creatorId'));
			}
			return ids;
		}, []);
		this.request.data.users.getByIds(
			creatorIds,
			(error, creators) => {
				if (error) { return callback(error); }
				this.postCreators = creators;
				callback();
			}
		);
	}

	// render the HTML needed for each post needed
	renderPosts (callback) {
		this.renderedPosts = [];
		BoundAsync.forEachSeries(
			this,
			this.posts,
			this.renderPost,
			callback
		);
	}

	// render the HTML needed for an individual post
	renderPost (post, callback) {
		const creator = this.postCreators.find(creator => creator.id === post.get('creatorId'));
		let parentPost;
		if (post.get('parentPostId')) {
			parentPost = this.parentPosts.find(parentPost => parentPost.id === post.get('parentPostId'));
		}
		const firstUserTimeZone = this.toReceiveEmails[0].get('timeZone') || Intl.DateTimeFormat().resolvedOptions().timeZone;
		// if all users have the same timezone, use the first one
		const timeZone = this.hasMultipleTimeZones ? null : firstUserTimeZone;
		new PostRenderer().render({
			post,
			creator,
			parentPost,
			sameAuthor: !this.hasMultipleAuthors,
			timeZone
		}, html => {
			this.renderedPosts.push({
				post: post,
				html: html
			});
			process.nextTick(callback);
		});
	}

	// determine which users get which posts, according to their last read message for the stream
	determinePostsPerUser (callback) {
		this.renderedPostsPerUser = {};
		this.mentionsPerUser = {};
		this.hasMultipleAuthorsPerUser = {};
		BoundAsync.forEachSeries(
			this,
			this.toReceiveEmails,
			this.determinePostsForUser,
			callback
		);
	}

	// determine which posts a given user will receive in the email, according to their last
	// read message for the stream
	determinePostsForUser (user, callback) {
		const lastReadSeqNum = user.get('lastReads')[this.stream.id];
		const lastReadPostIndex = this.posts.findIndex(post => post.get('seqNum') <= lastReadSeqNum);
		if (lastReadPostIndex === -1) {
			this.renderedPostsPerUser[user.id] = [...this.renderedPosts];
		}
		else {
			this.renderedPostsPerUser[user.id] = this.renderedPosts.slice(0, lastReadPostIndex);
		}
		if (this.renderedPostsPerUser.length === 0) {
			return process.nextTick(callback);
		}
		this.mentionsPerUser[user.id] = this.renderedPostsPerUser[user.id].find(renderedPost => {
			return renderedPost.post.mentionsUser(user);
		});
		const firstPost = this.renderedPostsPerUser[user.id][0].post;
		this.hasMultipleAuthorsPerUser[user.id] = this.renderedPostsPerUser[user.id].find(renderedPost => {
			return renderedPost.post.get('creatorId') !== firstPost.get('creatorId');
		});
		process.nextTick(callback);
	}

	// personalize each user's rendered posts as needed ... the rendered posts need to be
	// personalized if (1) they are not all from the same author (since we hide the author
	// if all emails are from the same author, but this is dependent on each user's list
	// of unread posts), OR (2) all the users receiving emails are not in the same time zone
	// (because the timestamps for the posts are timezone-dependent)
	personalizePerUser (callback) {
		if (!this.hasMultipleAuthors && !this.hasMultipleTimeZones) {
			return callback();
		}
		BoundAsync.forEachSeries(
			this,
			this.toReceiveEmails,
			this.personalizeRenderedPostsPerUser,
			callback
		);
	}

	// personalize the rendered posts for the given user, by making a copy of the
	// rendered html, and doing field substitution of author display and timestamp
	// as needed
	personalizeRenderedPostsPerUser (user, callback) {
		let personalizedRenders = [];
		this.renderedPostsPerUser[user.id].forEach(renderedPost => {
			let { html, post } = renderedPost;

			// if the user has multiple authors represented in the posts they are getting
			// in their email, we show the author usernames, otherwise hide them
			const hasMultipleAuthors = this.hasMultipleAuthors || this.hasMultipleAuthorsPerUser[user.id];
			let authorSpan = '';
			if (hasMultipleAuthors) {
				const creator = this.postCreators.find(creator => creator.id === post.get('creatorId'));
				if (creator) {
					authorSpan = PostRenderer.renderAuthorSpan(creator);
				}
			}
			html = html.replace(/\{\{\{authorSpan\}\}\}/g, authorSpan);

			// format the timestamp of this post with timezone dependency
			const datetime = PostRenderer.formatTime(post.get('createdAt'), user.get('timeZone'));
			html = html.replace(/\{\{\{datetime\}\}\}/g, datetime);

			personalizedRenders.push({ html, post });
		});
		this.renderedPostsPerUser[user.id] = personalizedRenders;
		process.nextTick(callback);
	}

	// render each user's email in html
	renderPerUser (callback) {
		this.renderedEmails = [];
		BoundAsync.forEachSeries(
			this,
			this.toReceiveEmails,
			this.renderEmailForUser,
			callback
		);
	}

	// render a single email for the given user
	renderEmailForUser (user, callback) {
		const renderedPosts = this.renderedPostsPerUser[user.id];
		renderedPosts.reverse(); // display earliest to latest
		if (
			renderedPosts.length === 0 ||
			!this.mentionsPerUser[user.id] || // per COD-436, only send email notifications to mentioned users
			!user.wantsEmail(this.stream, this.mentionsPerUser[user.id])
		) {
			// renderedPosts.length should not be 0, but this can still happen because at the
			// time we determined who preferred getting emails, we didn't have the posts, so
			// we didn't know if the user was mentioned, so we couldn't base our determination
			// on whether the user was mentioned ... now we can
			this.request.log(`User ${user.id}:${user.get('email')} has no posts to render, or is not mentioned, or does not want email notifications`);
			return callback();
		}
		const postsHtml = renderedPosts.map(renderedPost => renderedPost.html);
		new EmailNotificationRenderer().render({
			user,
			posts: postsHtml,
			team: this.team,
			repo: this.repo,
			stream: this.stream,
			mentioned: this.mentionsPerUser[user.id],
			offlineForRepo: this.onlineUserIdsForTeam.includes(user.id) // online for team, but offline for repo
		}, html => {
			html = html.replace(/[\t\n]/g, '');
			this.renderedEmails.push({ user, html });
			process.nextTick(callback);
		});

	}
	// send email notifications to all the offline members
	sendNotifications (callback) {
		BoundAsync.forEachSeries(
			this,
			this.renderedEmails,
			this.sendNotificationToUser,
			callback
		);
	}

	// send an email notification to the given user
	sendNotificationToUser (userAndHtml, callback) {
		const { user, html } = userAndHtml;
		const posts = this.renderedPostsPerUser[user.id].map(renderedPost => renderedPost.post);
		let creator;
		if (!this.hasMultipleAuthors || !this.hasMultipleAuthorsPerUser[user.id]) {
			creator = this.postCreators.find(creator => creator.id === posts[0].get('creatorId'));
		}
		let options = {
			request: this.request,
			content: html,
			user,
			posts,
			creator,
			stream: this.stream,
			team: this.team,
			mentioned: this.mentionsPerUser[user.id],
			sameAuthor: !this.hasMultipleAuthors
		};
		this.request.api.services.email.sendEmailNotification(
			options,
			error => {
				if (error) {
					this.request.warn(`Unable to send email notification to ${user.get('email')}: ${JSON.stringify(error)}`);
				}
				process.nextTick(callback);
			}
		);
	}

	// update each user as needed to indicate they have now received their first
	// email notification
	updateFirstEmails (callback) {
		const usersWhoReceivedEmails = this.renderedEmails.map(userAndHtml => userAndHtml.user);
		const usersToUpdate = usersWhoReceivedEmails.filter(user => !user.get('hasReceivedFirstEmail'));
		if (usersToUpdate.length === 0) {
			return callback();
		}
		const ids = usersToUpdate.map(user => user.id);
		this.request.data.users.updateDirect(
			{ _id: this.request.data.users.inQuerySafe(ids) },
			{ $set: { hasReceivedFirstEmail: true } },
			error => {
				if (error) {
					this.request.warn(`Unable to update hasReceivedFirstEmail flags for users ${ids}: ${JSON.stringify(error)}`);
				}
				process.nextTick(callback);
			}
		);
	}
}

module.exports = EmailNotificationSender;
