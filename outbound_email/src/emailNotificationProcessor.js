// handle sending email notifications in response to a new post

'use strict';

const Index = require('./postIndex');
const PostRenderer = require('./postRenderer');
const EmailNotificationRenderer = require('./emailNotificationRenderer');
const Path = require('path');
const Config = require('./config');
const EmailNotificationSender = require('./emailNotificationSender');

// make eslint happy
/* globals Intl */

class EmailNotificationProcessor {

	constructor (options) {
		Object.assign(this, options);
	}

	// send email notifications for a new post to all members that are not
	// currently online for the repo and the team
	async sendEmailNotifications () {
		await this.getTeam();					// get the team that owns the stream that owns the post
		await this.getRepo();					// get the repo that owns the stream that owns the post
		await this.getAllMembers();				// get all members of the team
		await this.getRepoSubscribedMembers();	// get users who are subscribed to the repo channel
		await this.getTeamSubscribedMembers();	// get users who are subscribed to the team channel
		await this.getOfflineMembers();			// get offline members: those who are not subscribed to the repo channel
		if (await this.filterByPreference()) { 	// filter to those who haven't turned email notifications off
			return;	// indicates no emails will be sent, so just abort
		}
		await this.getPosts(); 					// get the most recent posts in the stream
		await this.getEarlierPosts();			// get any posts created before the current post, if there are away timeouts
		if (await this.characterizePosts()) {	// characterize the posts for summary conditions
			return;	// indicates no emails will be sent, so just abort
		}			
		await this.getMarkers();				// get the markers representing the codeblocks of the posts
		await this.getStreams();				// get the streams representing the codeblocks of the posts
		await this.getRepos();					// get the repos representing the codeblocks of the posts
		await this.getParentPosts();			// get the parent post if this is a reply
		await this.getPostCreators();			// get the creators of all the posts
		await this.renderPosts();				// render the HTML for each post needed
		await this.determinePostsPerUser();		// determine which users get which posts
		await this.personalizePerUser();		// personalize the rendered posts as needed
		await this.renderPerUser();				// render each user's email
		await this.sendNotifications();			// send out the notifications
		await this.updateUsers();				// update user info concerning email notifications

		// return the last post in sequence for which an email was sent
		// (which is the first post in this array)
		return this.posts[0];
	}

	// get the team that owns the stream that owns the post
	async getTeam () {
		this.team = await this.data.teams.getById(this.stream.teamId);
	}

	// get the repo that owns the stream that owns the post
	async getRepo () {
		if (this.stream.repoId) {
			this.repo = await this.data.repos.getById(this.stream.repoId);
		}
	}

	// get all members of the team
	async getAllMembers () {
		let memberIds;
		if (this.userId) {
			memberIds = [this.userId];	// this is for the case where a user goes away
		}
		if (this.stream.type === 'file' || this.stream.isTeamStream) {
			memberIds = this.team.memberIds;
		}
		else {
			memberIds = this.stream.memberIds;
		}
		this.allMembers = await this.data.users.getByIds(memberIds);
	}

	// get the team members that are currently subscribed to the repo channel for the
	// repo to which the stream belongs
	async getRepoSubscribedMembers () {
		if (!this.repo) {	// not applicable to non file-type streams
			return;
		}
		// query the messager service (pubnub) for who is subscribed to the team channel
		const channel = 'repo-' + this.repo._id;
		try {
			this.onlineUserIdsForRepo = [];
			this.onlineUserIdsForRepo = await this.messager.getSubscribedUsers(
				channel,
				{ request: this.request }
			);
		}
		catch (error) {
			throw `Unable to obtain subscribed users for channel ${channel}: ${error}`;
		}
		this.logger.log(`These users are online for repo ${this.repo._id}: ${this.onlineUserIdsForRepo}`);
	}

	// get the team members that are currently subscribed to the team channel (they are online)
	async getTeamSubscribedMembers () {
		// query the messager service (pubnub) for who is subscribed to the team channel
		const channel = 'team-' + this.team._id;
		try {
			this.onlineUserIdsForTeam = [];
			this.onlineUserIdsForTeam = await this.messager.getSubscribedUsers(
				channel
			);
		}
		catch (error) {
			throw `Unable to obtain subscribed users for channel ${channel}: ${error}`;
		}
		this.logger.log(`These users are online for team ${this.team._id}: ${this.onlineUserIdsForTeam}`);
	}

	// get the user objects for the offline members
	async getOfflineMembers () {
		this.offlineMembers = this.allMembers.filter(member => {
			// if this is a non-file type stream, then if the user is offline for the team,
			// then they are truly offline ... there is no sense of whether they have the repo open or not
			if (this.stream.type !== 'file') {
				if (!this.onlineUserIdsForTeam.includes(member._id)) {
					return true;
				}
			}
			else {
				// for file-type streams, if they show as offline according to pubnub,
				// they are truly offline
				if (!this.onlineUserIdsForRepo.includes(member._id)) {
					return true;
				}
			}
			const isActive = this.hasActiveSession(member);
			if (isActive) {
				this.logger.log(`User ${member.email} is active so is not eligible for an email notification`);
			}
			return !isActive;
		});
	}

	// filter the offline members to those who haven't turned email notifications off
	async filterByPreference () {
		this.needPostsFromSeqNum = -1;
		this.toReceiveEmails = this.offlineMembers.filter(user => this.userToReceiveEmail(user));
		if (this.toReceiveEmails.length === 0) {
			return true; // short-circuit the flow
		}
		// record whether all the users to receive emails are in the same timezone,
		// if they are, then we don't need to personalize the rendering of each email,
		// since we can make all the timestamps the same
		const firstUser = this.toReceiveEmails[0];
		this.hasMultipleTimeZones = this.toReceiveEmails.find(user => user.timeZone !== firstUser.timeZone);
	}

	// determine whether the givenn user wants an email notification for the current post
	userToReceiveEmail (user) {
		// deactivated users never get emails
		if (user.deactivated) {
			return false;
		}

		// note that we assume the user is mentioned in the posts ... we don't have the posts yet
		// (and we don't know which ones to get until we know which users want emails), so we are
		// optimistic that the user will want a notification ... then, after we get the posts, we
		// can filter down to those users who really want an email based on mentions
		let wantsEmail = this.userWantsEmail(user, this.stream, true);
		if (wantsEmail) {
			const lastReadSeqNum = user.lastReads && user.lastReads[this.stream._id];
			if (typeof lastReadSeqNum !== 'undefined') {
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
		}
		else {
			this.logger.log(`User ${user._id}:${user.email} has email notifications turned off for this stream`);
		}
		return wantsEmail;
	}

	// get the most recent posts in the stream, by sequence number
	async getPosts () {
		const query = {
			streamId: this.stream._id,
			seqNum: { $gte: this.needPostsFromSeqNum }
		};
		this.posts = await this.data.posts.getByQuery(
			query,
			{
				sort: { seqNum: -1 },
				limit: Config.maxPostsPerEmail,
				hint: Index.bySeqNum
			}
		);
		this.logger.log(`Fetched ${this.posts.length} posts for email notifications`);
	}

	// get any posts earlier than the triggering post, that may be representative of the user
	// having gone "away" between the triggering post and their last read post
	async getEarlierPosts () {
		// no need to get earlier posts if we've already reached maximum
		if (this.posts.length === Config.maxPostsPerEmail) {
			return;
		}

		// look for any users who have their last activity prior to the creation time 
		// of the earliest post, and who have not yet been sent an email up to and including
		// the most recent sequence number to that one ... this means that there may be
		// posts that users would otherwise miss emails for because they went away in the
		// time between their last activity and this earlier post
		// NOTE that if the triggering post to this email was deactivated, then there may in
		// fact be no post, but we still need to look for earlier posts
		const earliestPost = this.posts.length > 0 ? this.posts[this.posts.length - 1] : null;
		const needActivityBefore = earliestPost ? earliestPost.createdAt : Date.now();
		if (!this.offlineMembers.find(user => {
			const lastEmailsSent = user.lastEmailsSent || {};
			const lastSeqNumSent = lastEmailsSent[this.stream._id] || 0;
			return (
				user.lastActivityAt && 
				user.lastActivityAt < needActivityBefore &&
				(
					!earliestPost ||
					lastSeqNumSent < earliestPost.seqNum - 1
				)
			);
		})) {
			// no need to get any earlier posts
			return;
		}

		// fetch up to the limit of posts
		const query = {
			streamId: this.stream._id
		};
		if (earliestPost) {
			query.seqNum = {
				$lt: earliestPost.seqNum
			};
		}
		const earlierPosts = await this.data.posts.getByQuery(
			query,
			{
				sort: { seqNum: -1 },
				limit: Config.maxPostsPerEmail - this.posts.length,
				hint: Index.bySeqNum
			}
		);
		this.logger.log(`Fetched additional ${earlierPosts.length} posts due to away timers`);
		this.posts = [...this.posts, ...earlierPosts];
	}

	// characterize the posts we have by filtering out any deactivated ones, determining whether we have
	// multiple authors represented, and whether we have emojis present, all of which affect later treatment
	async characterizePosts () {
		// filter out any deactivated posts, and short-circuit if we don't have any left
		this.posts = this.posts.filter(post => !post.deactivated);
		if (this.posts.length === 0) {
			this.logger.log('Aborting email notifications, all posts are deactivated');
			return true;
		}

		// record whether we have multiple authors represented in the posts
		const firstPost = this.posts[0];
		this.hasMultipleAuthors = this.posts.find(post => post.creatorId !== firstPost.creatorId);
		
		// record whether we have any emotes represented in the posts 
		// (which must be displayed even if we would otherwise suppress the author line)
		this.hasEmotes = this.posts.find(post => this.getPostEmote(post));
	}

	// get the markers representing the code blocks of the posts
	async getMarkers () {
		this.codeBlocks = this.posts.reduce((codeBlocks, post) => {
			if (post.codeBlocks) {
				codeBlocks = [...codeBlocks, ...post.codeBlocks];
			}
			return codeBlocks;
		}, []);
		this.markerIds = this.codeBlocks.map(codeBlock => codeBlock.markerId);
		this.markers = await this.data.markers.getByIds(this.markerIds);
	}

	// get the streams representing the code blocks of the posts
	async getStreams () {
		this.streamIds = this.markers.reduce((streamIds, marker) => {
			if (!streamIds.includes(marker.streamId)) {
				streamIds.push(marker.streamId);
			}
			return streamIds;
		}, []);
		this.streams = await this.data.streams.getByIds(this.streamIds);
	}

	// get the repos representing the code blocks of the posts
	async getRepos () {
		this.repoIds = this.streams.reduce((repoIds, stream) => {
			if (!repoIds.includes(stream.repoId)) {
				repoIds.push(stream.repoId);
			}
			return repoIds;
		}, []);
		this.repos = await this.data.repos.getByIds(this.repoIds);
	}

	// get the parent post to any post in the array of posts to go in the email notification,
	// for those posts that are replies
	async getParentPosts () {
		const parentPostIds = this.posts.reduce((ids, post) => {
			if (post.parentPostId) {
				ids.push(post.parentPostId);
			}
			return ids;
		}, []);
		if (parentPostIds.length === 0) {
			return; // no replies!
		}
		this.parentPosts = await this.data.posts.getByIds(parentPostIds);
	}

	// get the creators of all the posts, gleaned from the members
	async getPostCreators () {
		const creatorIds = this.posts.reduce((ids, post) => {
			if (!ids.includes(post.creatorId)) {
				ids.push(post.creatorId);
			}
			return ids;
		}, []);
		this.postCreators = creatorIds.reduce((creators, creatorId) => {
			const creator = this.allMembers.find(member => member._id === creatorId);
			if (creator) {
				creators.push(creator);
			}
			return creators;
		}, []); 
	}

	// render the HTML needed for each post needed
	async renderPosts () {
		this.renderedPosts = [];
		for (let post of this.posts) {
			await this.renderPost(post);
		}
	}

	// render the HTML needed for an individual post
	async renderPost (post) {
		const creator = this.postCreators.find(creator => creator._id === post.creatorId);
		let parentPost;
		if (post.parentPostId) {
			parentPost = this.parentPosts.find(parentPost => parentPost._id === post.parentPostId);
		}
		const firstUserTimeZone = this.toReceiveEmails[0].timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
		// if all users have the same timezone, use the first one
		const timeZone = this.hasMultipleTimeZones ? null : firstUserTimeZone;
		const html = new PostRenderer().render({
			post,
			creator,
			parentPost,
			suppressAuthors: !this.hasMultipleAuthors && !this.hasEmotes,
			timeZone,
			markers: this.markers,
			streams: this.streams,
			repos: this.repos,
			members: this.allMembers
		});
		this.renderedPosts.push({
			post: post,
			html: html
		});
	}

	// determine which users get which posts, according to their last read message for the stream
	async determinePostsPerUser () {
		this.renderedPostsPerUser = {};
		this.mentionsPerUser = {};
		this.hasMultipleAuthorsPerUser = {};
		this.hasEmotesPerUser = {};
		for (let user of this.toReceiveEmails) {
			await this.determinePostsForUser(user);
		}
	}

	// determine which posts a given user will receive in the email, according to their last
	// read message for the stream
	async determinePostsForUser (user) {
		const lastReadSeqNum = user.lastReads[this.stream._id] || 0;
		const lastActivityAt = user.lastActivityAt || null;
		const lastEmailsSent = user.lastEmailsSent || {};
		const lastEmailSent = lastEmailsSent[this.stream._id] || 0;

		const lastReadPostIndex = this.posts.findIndex(post => {
			// look back for any posts authored by this user, as a failsafe
			if (post.creatorId === user._id) {
				return true;
			}

			// otherwise look for posts already sent in an email notification
			else if (post.seqNum <= lastEmailSent) {
				return true;
			}

			// otherwise, if the user has no activity, it's either because they've never logged on,
			// or because they haven't logged on since we started saving activity ... in either case,
			// send posts through the last sequence number they've read
			else if (lastActivityAt === null) {
				return post.seqNum <= lastReadSeqNum;
			}

			// otherwise, send any posts since the user's last activity
			else {
				return post.createdAt < lastActivityAt;
			}
		});
		if (lastReadPostIndex === -1) {
			this.renderedPostsPerUser[user._id] = [...this.renderedPosts];
		}
		else {
			this.renderedPostsPerUser[user._id] = this.renderedPosts.slice(0, lastReadPostIndex);
		}
		if (this.renderedPostsPerUser[user._id].length === 0) {
			return;
		}

		if (this.stream.type === 'direct') {
			// direct messages are treated like mentions
			this.mentionsPerUser[user._id] = true;
		}
		else {
			// otherwise, need to look through the posts per user
			this.renderedPostsPerUser[user._id].find(renderedPost => {
				if (this.postMentionsUser(renderedPost.post, user)) {
					this.mentionsPerUser[user._id] = renderedPost.post.creatorId;
					return true;
				}
			});
		}

		const firstPost = this.renderedPostsPerUser[user._id][0].post;
		this.hasMultipleAuthorsPerUser[user._id] = this.renderedPostsPerUser[user._id].find(renderedPost => {
			return renderedPost.post.creatorId !== firstPost.creatorId;
		});
		this.hasEmotesPerUser[user._id] = this.renderedPostsPerUser[user._id].find(renderedPost => {
			return this.getPostEmote(renderedPost.post);
		});
	}

	// personalize each user's rendered posts as needed ... the rendered posts need to be
	// personalized if (1) they are not all from the same author (since we hide the author
	// if all emails are from the same author, but this is dependent on each user's list
	// of unread posts), OR (2) all the users receiving emails are not in the same time zone
	// (because the timestamps for the posts are timezone-dependent)
	async personalizePerUser () {
		if (!this.hasMultipleAuthors && !this.hasEmotes && !this.hasMultipleTimeZones) {
			return;
		}
		for (let user of this.toReceiveEmails) {
			await this.personalizeRenderedPostsPerUser(user);
		}
	}

	// personalize the rendered posts for the given user, by making a copy of the
	// rendered html, and doing field substitution of author display and timestamp
	// as needed
	async personalizeRenderedPostsPerUser (user) {
		let personalizedRenders = [];
		this.renderedPostsPerUser[user._id].forEach(renderedPost => {
			let { html, post } = renderedPost;

			// if the user has multiple authors represented in the posts they are getting
			// in their email, we show the author usernames, otherwise hide them
			const suppressAuthor = !this.hasMultipleAuthorsPerUser[user._id] && !this.hasEmotesPerUser[user._id];
			let authorSpan = '';
			if (!suppressAuthor) {
				const creator = this.postCreators.find(creator => creator._id === post.creatorId);
				if (creator) {
					authorSpan = PostRenderer.renderAuthorSpan(creator, this.getPostEmote(post));
				}
			}
			html = html.replace(/\{\{\{authorSpan\}\}\}/g, authorSpan);

			// format the timestamp of this post with timezone dependency
			const datetime = PostRenderer.formatTime(post.createdAt, user.timeZone);
			html = html.replace(/\{\{\{datetime\}\}\}/g, datetime);

			personalizedRenders.push({ html, post });
		});
		this.renderedPostsPerUser[user._id] = personalizedRenders;
	}

	// render each user's email in html
	async renderPerUser () {
		this.renderedEmails = [];
		for (let user of this.toReceiveEmails) {
			await this.renderEmailForUser(user);
		}
	}

	// render a single email for the given user
	async renderEmailForUser (user) {
		const renderedPosts = this.renderedPostsPerUser[user._id];
		renderedPosts.reverse(); // display earliest to latest
		if (
			renderedPosts.length === 0 ||
			/* Disabling per COD-525, countermanding COD-436 ... oh the joy
			!this.mentionsPerUser[user._id] || // per COD-436, only send email notifications to mentioned users
			*/
			!this.userWantsEmail(user, this.stream, !!this.mentionsPerUser[user._id])
		) {
			// renderedPosts.length should not be 0, but this can still happen because at the
			// time we determined who preferred getting emails, we didn't have the posts, so
			// we didn't know if the user was mentioned, so we couldn't base our determination
			// on whether the user was mentioned ... now we can
			this.logger.log(`User ${user._id}:${user.email} has no posts to render, or is not mentioned, or does not want email notifications`);
			return;
		}
		const postsHtml = renderedPosts.map(renderedPost => renderedPost.html);
		const offlineForRepo = (
			this.stream.type === 'file' &&
			this.onlineUserIdsForTeam.includes(user._id)
		); // online for team, but offline for repo
		let html = new EmailNotificationRenderer().render({
			user,
			posts: postsHtml,
			team: this.team,
			repo: this.repo,
			stream: this.stream,
			mentioned: !!this.mentionsPerUser[user._id],
			streams: this.streams,
			offlineForRepo,
			supportEmail: Config.supportEmail
		});
		html = html.replace(/[\t\n]/g, '');
		this.renderedEmails.push({ user, html });
	}

	// send email notifications to all the offline members
	async sendNotifications () {
		await Promise.all(this.renderedEmails.map(async userAndHtml => {
			await this.sendNotificationToUser(userAndHtml);
		}));
	}

	// send an email notification to the given user
	async sendNotificationToUser (userAndHtml) {
		const { user, html } = userAndHtml;
		const posts = this.renderedPostsPerUser[user._id].map(renderedPost => renderedPost.post);
		let creator;
		if (!this.hasMultipleAuthors || !this.hasMultipleAuthorsPerUser[user._id]) {
			creator = this.postCreators.find(creator => creator._id === posts[0].creatorId);
		}
		const mentioningAuthor = this.mentionsPerUser[user._id] ?
			this.postCreators.find(creator => creator._id === this.mentionsPerUser[user._id]) :
			null;
		const options = {
			logger: this.logger,
			sender: this.sender,
			content: html,
			user,
			posts,
			creator,
			mentioningAuthor,
			stream: this.stream,
			team: this.team,
			streams: this.streams,
			repos: this.repos,
			markers: this.markers,
			members: this.allMembers,
			postCreators: this.postCreators
		};
		try {
			this.logger.log(`Sending email notification to ${user.email}, posts from ${posts[0]._id} to ${posts[posts.length-1]._id}`);
			await new EmailNotificationSender().sendEmailNotification(options);
		}
		catch (error) {
			this.logger.warn(`Unable to send email notification to ${user.email}: ${JSON.stringify(error)}`);
		}
	}

	// update each user as needed to indicate:
	//  (1) they have now received their first email notification
	//  (2) the last email sent to them for this stream
	async updateUsers () {
		const usersToUpdate = this.renderedEmails.map(userAndHtml => userAndHtml.user);
		await Promise.all(usersToUpdate.map(async user => {
			await this.updateUser(user);
		}));
	}

	async updateUser (user) {
		const posts = this.renderedPostsPerUser[user._id];
		const lastPost = posts[posts.length - 1].post;
		const op = { 
			$set: {
				[`lastEmailsSent.${this.stream._id}`]: lastPost.seqNum
			} 
		};
		if (!user.hasReceivedFirstEmail) {
			op.$set.hasReceivedFirstEmail = true; 
		}
		try {
			await this.data.users.updateDirect(
				{ _id: this.data.users.objectIdSafe(user._id) },
				op
			);
		}
		catch (error) {
			this.logger.warn(`Unable to update user ${user._id} after email notification: ${JSON.stringify(error)}`);
		}
	}

	// determine if the given user has an active session, which means a session
	// with status online, and updated since the awayTimeout
	hasActiveSession (user) {
		const sessions = user.sessions;
		if (typeof sessions !== 'object') {
			// until we start collection session status, we assume they are online
			// this continues existing email notification behavior if the user has
			// not updated their plugin to the version that tracks presence
			return true;
		}
		return Object.values(sessions).find(session => {
			const now = Date.now();
			return (
				session.status === 'online' &&
				session.updatedAt > now - Config.sessionAwayTimeout
			);
		});
	}

	// determine if this user wants an email notification for a post in the given
	// stream, which may depend on whether they are mentioned in the post
	userWantsEmail (user, stream, mentioned) {
		// first, if this user is not yet registered, we only send emails if they are mentioned
		if (!user.isRegistered && !mentioned) {
			return false;
		}

		// then, look for a general email preference of 'off'
		if (this.noEmailNotificationsByPreference(user, mentioned)) {
			return false;
		}

		// now - for file-type streams - look for individual stream treatments for the repo,
		// paths can be muted
		const wantEmail = this.wantEmailNotificationsByTreatment(user, stream);
		if (typeof wantEmail === 'boolean') {
			return wantEmail;
		}

		// for non-file streams, look for individual muted setting
		return this.wantEmailNotificationsByMuted(user, stream, mentioned);
	}

	// determine if the user has email notifications turned off by preference
	noEmailNotificationsByPreference (user, mentioned) {
		const preferences = user.preferences || {};
		if (
			preferences &&
			(
				preferences.emailNotifications === 'off' ||
				(
					preferences.emailNotifications === 'mentions' &&
					!mentioned
				)
			)
		) {
			return true;
		}
	}

	// determine if the user has a preference for email notifications according to 
	// specific stream treatment (for file streams, to be deprecated)
	wantEmailNotificationsByTreatment (user, stream) {
		if (stream.type !== 'file') {
			return;	// only applicable for file streams
		}
		const preferences = user.preferences || {};
		const streamTreatments = typeof preferences.streamTreatments === 'object' &&
			preferences.streamTreatments[stream.repoId];
		if (!streamTreatments) {
			return true;
		}

		let n = 0;	// failsafe to prevent infinite loop
		// walk up the path tree looking for any muted directories
		let path = stream.file;
		do {
			const starryPath = path.replace(/\./g, '*');
			if (streamTreatments[starryPath] === 'mute') {
				return false;
			}
			path = (path === '/' || path === '.') ? null : Path.dirname(path);
			n++;
		} while (path && n < 100);	// god help them if they have paths with 100 levels

		// no muted directories that are parents to this file, we are free to
		// send a notification!
		return true;
	}

	// determine if the user has a preference for email notifications according to
	// whether a stream is muted, this is for non-file streams only
	wantEmailNotificationsByMuted (user, stream, mentioned) {
		if (mentioned) {
			return true; // muting a stream doesn't turn off email notifications when the user is mentioned
		}
		const preferences = user.preferences || {};
		const mutedStreams = preferences.mutedStreams || {};
		return !mutedStreams[stream._id];
	}

	// does this post mention the current user?
	postMentionsUser (post, user) {
		const mentionedUserIds = post.mentionedUserIds || [];
		return mentionedUserIds.includes(user._id);
	}

	// get the emote for this post, if it starts with /me (basically the rest of the post)
	getPostEmote (post) {
		const text = post.text || '';
		const match = text.match(/^\/me\s+(.*)/);
		post.hasEmote = match && match.length > 1 && match[1];
		return post.hasEmote;
	}
}

module.exports = EmailNotificationProcessor;
