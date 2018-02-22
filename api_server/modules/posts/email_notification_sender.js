// handle sending email notifications in response to a new post

'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Indexes = require('./indexes');
const PostRenderer = require('./post_renderer');
const EmailNotificationRenderer = require('./email_notification_renderer');

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
			this.getRepoSubscribedMembers,	// get users who are subscribed to the repo channel
			this.getTeamSubscribedMembers,	// get users who are subscribed to the team channel
			this.getOfflineMembers,			// get offline members: those who are not subscribed to the repo channel
			this.filterByPreference,		// filter to those who haven't turned email notifications off
			this.getPosts,					// get the most recent posts in the stream
			this.getParentPosts,			// get the parent post if this is a reply
			this.getPostCreators,			// get the creators of all the posts
			this.renderPosts,				// render the HTML for each post needed
			this.determinePostsPerUser,		// determine which users get which posts
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
		// filter out members who are online for the repo
		let offlineMemberIds = this.team.get('memberIds').filter(memberId => {
			return this.onlineUserIdsForRepo.indexOf(memberId) === -1;
		});
		if (offlineMemberIds.length === 0) {
			this.offlineMembers = [];
			return callback();
		}
		this.request.data.users.getByIds(
			offlineMemberIds,
			(error, members) => {
				if (error) { return callback(error); }
				// don't send notifications to deactivated users, and don't send to the author
				// of the post
				this.offlineMembers = members.filter(member => {
					return !member.get('deactivated');
				});
				process.nextTick(callback);
			}
		);
	}

	// filter the offline members to those who haven't turned email notifications off
	filterByPreference (callback) {
		this.needPostsFromSeqNum = -1;
		this.toReceiveEmails = this.offlineMembers.filter(user => this.userWantsEmail(user));
		if (this.toReceiveEmails.length === 0) {
			return callback(true);	// short-circuit the flow
		}
		else {
			process.nextTick(callback);
		}
	}

	// determine whether the givenn user wants an email notification for the current post
	userWantsEmail (user) {
		const lastReadSeqNum = user.get('lastReads') && user.get('lastReads')[this.stream.id];
		if (!lastReadSeqNum) {
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
				callback(this.posts.length === 0);	// short-circuits if there are no posts
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
		new PostRenderer().render({
			post,
			creator,
			parentPost
		}, html => {
			this.renderedPosts.push(html);
			process.nextTick(callback);
		});
	}

	// determine which users get which posts, according to their last read message for the stream
	determinePostsPerUser (callback) {
		this.renderedPostsPerUser = {};
		this.postsPerUser = {};
		this.mentionsPerUser = {};
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
			this.postsPerUser[user.id] = [...this.posts];
		}
		else {
			this.renderedPostsPerUser[user.id] = this.renderedPosts.slice(0, lastReadPostIndex);
			this.postsPerUser[user.id] = this.posts.slice(0, lastReadPostIndex);
		}
		this.mentionsPerUser[user.id] = this.postsPerUser[user.id].find(post => {
			return post.mentionsUser(user);
		});
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
			!user.wantsEmail(this.stream, this.mentionsPerUser[user.id])
		) {
			// renderedPosts.length should not be 0, but this can still happen because at the
			// time we determined who preferred getting emails, we didn't have the posts, so
			// we didn't know if the user was mentioned, so we couldn't base our determination
			// on whether the user was mentioned ... now we can
			return callback();
		}
		new EmailNotificationRenderer().render({
			user,
			posts: renderedPosts,
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
		const posts = this.postsPerUser[user.id];
		let creator;
		if (posts.length === 1) {
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
