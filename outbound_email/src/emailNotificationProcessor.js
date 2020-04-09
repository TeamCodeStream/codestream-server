// handle sending email notifications in response to a new post

'use strict';

const Index = require('./postIndex');
const PostRenderer = require('./postRenderer');
const EmailNotificationRenderer = require('./emailNotificationRenderer');
const Path = require('path');
const EmailNotificationSender = require('./emailNotificationSender');

const DEFAULT_TIME_ZONE = 'America/New_York';

class EmailNotificationProcessor {

	constructor (options) {
		Object.assign(this, options);
	}

	// send email notifications for a new post to all members that are not
	// currently online for the repo and the team
	async sendEmailNotifications () {
		await this.getTeam();					// get the team that owns the stream that owns the post
		await this.getAllMembers();				// get all members of the team
		await this.getSubscribedMembers();		// get users who are subscribed to the team channel
		await this.getOfflineMembers();			// get offline members: those who are not subscribed to the repo channel
		if (await this.filterByPreference()) { 	// filter to those who haven't turned email notifications off
			return;	// indicates no emails will be sent, so just abort
		}
		await this.getPosts(); 					// get the most recent posts in the stream
		await this.getEarlierPosts();			// get any posts created before the current post, if there are away timeouts
		if (await this.filterDeactivatedPosts()) {	// filter out any deactivated posts, and abort as needed
			return;	// indicates no emails will be sent, so just abort
		}	
		await this.getCodemarks();				// get the codemarks attached to the posts		
		await this.getMarkers();				// get the markers referenced by the codemarks
		await this.characterizePosts();			// characterize the posts for later processing
		await this.getStreams();				// get the file-streams representing the markers
		await this.getRepos();					// get the repos representing the file-streams
		await this.getParentPosts();			// get the parent post if this is a reply
		await this.getParentCodemarks();		// get the parent codemark if this is a reply
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

	// get the team members that are currently subscribed to the team channel (they are online)
	async getSubscribedMembers () {
		// query the broadcaster service for who is subscribed to the team channel
		const channel = 'team-' + this.team.id;
		try {
			this.onlineUserIdsForTeam = [];
			this.onlineUserIdsForTeam = await this.broadcaster.getSubscribedUsers(
				channel
			);
		}
		catch (error) {
			throw `Unable to obtain subscribed users for channel ${channel}: ${error}`;
		}
		this.logger.log(`These users are online for team ${this.team.id}: ${this.onlineUserIdsForTeam}`);
	}

	// get the user objects for the offline members
	async getOfflineMembers () {
		this.offlineMembers = this.allMembers.filter(member => {
			// if the user is offline for the team, they can not be active
			if (!this.onlineUserIdsForTeam.includes(member.id)) {
				return true;
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
		const firstUserTimeZone = firstUser.timeZone || DEFAULT_TIME_ZONE;
		this.hasMultipleTimeZones = this.toReceiveEmails.find(user => (user.timeZone || DEFAULT_TIME_ZONE) !== firstUserTimeZone);
	}

	// determine whether the given user wants an email notification for the current post
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
			const lastReadSeqNum = user.lastReads && user.lastReads[this.stream.id];
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
			this.logger.log(`User ${user.id}:${user.email} has email notifications turned off for this stream`);
		}
		return wantsEmail;
	}

	// get the most recent posts in the stream, by sequence number
	async getPosts () {
		const query = {
			streamId: this.stream.id,
			seqNum: { $gte: this.needPostsFromSeqNum }
		};
		this.posts = await this.data.posts.getByQuery(
			query,
			{
				sort: { seqNum: -1 },
				limit: this.outboundEmailServer.config.maxPostsPerEmail,
				hint: Index.bySeqNum
			}
		);
		this.logger.log(`Fetched ${this.posts.length} posts for email notifications`);
	}

	// get any posts earlier than the triggering post, that may be representative of the user
	// having gone "away" between the triggering post and their last read post
	async getEarlierPosts () {
		// no need to get earlier posts if we've already reached maximum
		if (this.posts.length === this.outboundEmailServer.config.maxPostsPerEmail) {
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
			const lastSeqNumSent = lastEmailsSent[this.stream.id] || 0;
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
			streamId: this.stream.id
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
				limit: this.outboundEmailServer.config.maxPostsPerEmail - this.posts.length,
				hint: Index.bySeqNum
			}
		);
		this.logger.log(`Fetched additional ${earlierPosts.length} posts due to away timers`);
		this.posts = [...this.posts, ...earlierPosts];
	}

	// filter out any deactivated posts and abort email notifications if none are left
	async filterDeactivatedPosts () {
		this.posts = this.posts.filter(post => !post.deactivated);
		if (this.posts.length === 0) {
			this.logger.log('Aborting email notifications, all posts are deactivated');
			return true;
		}
	}

	// get the codemarks attached to the posts
	async getCodemarks () {
		const codemarkIds = this.posts.reduce((codemarkIds, post) => {
			if (post.codemarkId) {
				codemarkIds.push(post.codemarkId);
			}
			return codemarkIds;
		}, []);
		if (codemarkIds.length === 0) {
			return;
		}
		this.codemarks = await this.data.codemarks.getByIds(codemarkIds);
	}

	// get the markers referenced by the codemarks
	async getMarkers () {
		if (!this.codemarks) { return; }
		const markerIds = this.codemarks.reduce((markerIds, codemark) => {
			if (codemark.markerIds && codemark.markerIds.length) {
				markerIds = [...markerIds, ...codemark.markerIds];
			}
			return markerIds;
		}, []);
		if (markerIds.length === 0) {
			return;
		}
		this.markers = await this.data.markers.getByIds(markerIds);
		this.markers = this.markers.filter(marker => !marker.supersededByMarkerId);
		return this.markers;
	}

	// characterize the posts we have by determining whether we have multiple authors represented, 
	// and whether we have emojis or non-comment codemarks present, all of which affect later treatment
	async characterizePosts () {
		// record whether we have multiple authors represented in the posts
		const firstPost = this.posts[0];
		this.hasMultipleAuthors = this.posts.find(post => post.creatorId !== firstPost.creatorId);
		
		// record whether we have any emotes represented in the posts 
		// (which must be displayed even if we would otherwise suppress the author line)
		this.hasEmotes = this.posts.find(post => this.getPostEmote(post));

		// record whether we have any non-comment codemarks represented in the posts 
		// (which must be displayed even if we would otherwise suppress the author line)
		this.hasNonCommentCodemarks = this.posts.find(post => this.getNonCommentCodemark(post));
	}

	// get the streams representing the code blocks of the posts
	async getStreams () {
		if (!this.markers) { return; }
		const fileStreamIds = this.markers.reduce((streamIds, marker) => {
			if (!streamIds.includes(marker.streamId)) {
				streamIds.push(marker.streamId);
			}
			return streamIds;
		}, []);
		if (fileStreamIds.length === 0) {
			return;
		}
		this.fileStreams = await this.data.streams.getByIds(fileStreamIds);
	}

	// get the repos representing the code blocks of the posts
	async getRepos () {
		if (!this.streams) { return; }
		const repoIds = this.streams.reduce((repoIds, stream) => {
			if (!repoIds.includes(stream.repoId)) {
				repoIds.push(stream.repoId);
			}
			return repoIds;
		}, []);
		if (repoIds.length === 0) {
			return;
		}
		this.repos = await this.data.repos.getByIds(repoIds);
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

	// get the parent codemark to any post in the array of posts to go in the email notification,
	// for those posts that are replies
	async getParentCodemarks () {
		if (!this.parentPosts) {
			return;
		}
		const parentCodemarkIds = this.parentPosts.reduce((ids, post) => {
			if (post.codemarkId) {
				ids.push(post.codemarkId);
			}
			return ids;
		}, []);
		if (parentCodemarkIds.length === 0) {
			return;
		}
		this.parentCodemarks = await this.data.codemarks.getByIds(parentCodemarkIds);
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
			const creator = this.allMembers.find(member => member.id === creatorId);
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
		const creator = this.postCreators.find(creator => creator.id === post.creatorId);
		let parentPost, parentCodemark;
		if (post.parentPostId) {
			parentPost = this.parentPosts.find(parentPost => parentPost.id === post.parentPostId);
			if (parentPost && parentPost.codemarkId) {
				parentCodemark = this.parentCodemarks.find(parentCodemark => parentCodemark.id === parentPost.codemarkId);
			}
		}
		const firstUserTimeZone = this.toReceiveEmails[0].timeZone || DEFAULT_TIME_ZONE;
		// if all users have the same timezone, use the first one
		const timeZone = this.hasMultipleTimeZones ? null : firstUserTimeZone;
		const html = new PostRenderer().render({
			post,
			creator,
			parentPost,
			parentCodemark,
			suppressAuthors: !this.hasMultipleAuthors && !this.hasEmotes && !this.hasNonCommentCodemarks,
			timeZone,
			codemarks: this.codemarks,
			markers: this.markers,
			fileStreams: this.fileStreams,
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
		this.hasNonCommentCodemarksPerUser = {};
		for (let user of this.toReceiveEmails) {
			await this.determinePostsForUser(user);
		}
	}

	// determine which posts a given user will receive in the email, according to their last
	// read message for the stream
	async determinePostsForUser (user) {
		const lastReads = user.lastReads || {};
		const lastReadSeqNum = lastReads[this.stream.id] || 0;
		const lastActivityAt = user.lastActivityAt || null;
		const lastEmailsSent = user.lastEmailsSent || {};
		const lastEmailSent = lastEmailsSent[this.stream.id] || 0;

		const lastReadPostIndex = this.posts.findIndex(post => {
			// look back for any posts authored by this user, as a failsafe
			if (post.creatorId === user.id) {
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
			this.renderedPostsPerUser[user.id] = [...this.renderedPosts];
		}
		else {
			this.renderedPostsPerUser[user.id] = this.renderedPosts.slice(0, lastReadPostIndex);
		}
		if (this.renderedPostsPerUser[user.id].length === 0) {
			return;
		}

		if (this.stream.type === 'direct') {
			// direct messages are treated like mentions
			this.mentionsPerUser[user.id] = true;
		}
		else {
			// otherwise, need to look through the posts per user
			this.renderedPostsPerUser[user.id].find(renderedPost => {
				if (this.postMentionsUser(renderedPost.post, user)) {
					this.mentionsPerUser[user.id] = renderedPost.post.creatorId;
					return true;
				}
			});
		}

		const firstPost = this.renderedPostsPerUser[user.id][0].post;
		this.hasMultipleAuthorsPerUser[user.id] = this.renderedPostsPerUser[user.id].find(renderedPost => {
			return renderedPost.post.creatorId !== firstPost.creatorId;
		});
		this.hasEmotesPerUser[user.id] = this.renderedPostsPerUser[user.id].find(renderedPost => {
			return this.getPostEmote(renderedPost.post);
		});
		this.hasNonCommentCodemarksPerUser[user.id] = this.renderedPostsPerUser[user.id].find(renderedPost => {
			return this.getNonCommentCodemark(renderedPost.post);
		});
	}

	// personalize each user's rendered posts as needed ... the rendered posts need to be
	// personalized if (1) they are not all from the same author (since we hide the author
	// if all emails are from the same author, but this is dependent on each user's list
	// of unread posts), OR (2) all the users receiving emails are not in the same time zone
	// (because the timestamps for the posts are timezone-dependent)
	async personalizePerUser () {
		if (
			!this.hasMultipleAuthors &&
			!this.hasEmotes &&
			!this.hasMultipleTimeZones &&
			!this.hasNonCommentCodemarks
		) {
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
		this.renderedPostsPerUser[user.id].forEach(renderedPost => {
			let { html, post } = renderedPost;

			// if the user has multiple authors represented in the posts they are getting
			// in their email, we show the author usernames, otherwise hide them,
			// we also show the author line if the post text has an emote, or an activity 
			// coming from a non-comment codemark
			const suppressAuthor = (
				!this.hasMultipleAuthorsPerUser[user.id] &&
				!this.hasEmotesPerUser[user.id] &&
				!this.hasNonCommentCodemarksPerUser[user.id]
			);
			let authorSpan = '';
			if (!suppressAuthor) {
				const creator = this.postCreators.find(creator => creator.id === post.creatorId);
				if (creator) {
					authorSpan = PostRenderer.renderAuthorSpan(
						creator,
						this.getNonCommentCodemark(post),
						this.getPostEmote(post)
					);
				}
			}
			html = html.replace(/\{\{\{authorSpan\}\}\}/g, authorSpan);

			// format the timestamp of this post with timezone dependency
			const datetime = PostRenderer.formatTime(post.createdAt, user.timeZone || DEFAULT_TIME_ZONE);
			html = html.replace(/\{\{\{datetime\}\}\}/g, datetime);

			personalizedRenders.push({ html, post });
		});
		this.renderedPostsPerUser[user.id] = personalizedRenders;
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
		const renderedPosts = this.renderedPostsPerUser[user.id];
		renderedPosts.reverse(); // display earliest to latest
		if (
			renderedPosts.length === 0 ||
			/* Disabling per COD-525, countermanding COD-436 ... oh the joy
			!this.mentionsPerUser[user.id] || // per COD-436, only send email notifications to mentioned users
			*/
			!this.userWantsEmail(user, this.stream, !!this.mentionsPerUser[user.id])
		) {
			// renderedPosts.length should not be 0, but this can still happen because at the
			// time we determined who preferred getting emails, we didn't have the posts, so
			// we didn't know if the user was mentioned, so we couldn't base our determination
			// on whether the user was mentioned ... now we can
			this.logger.log(`User ${user.id}:${user.email} has no posts to render, or is not mentioned, or does not want email notifications`);
			return;
		}
		const postsHtml = renderedPosts.map(renderedPost => renderedPost.html);
		let html = new EmailNotificationRenderer().render({
			user,
			posts: postsHtml,
			team: this.team,
			stream: this.stream,
			mentioned: !!this.mentionsPerUser[user.id],
			supportEmail: this.outboundEmailServer.config.supportEmail,
			inboundEmailDisabled: this.outboundEmailServer.config.inboundEmailDisabled
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
		const posts = this.renderedPostsPerUser[user.id].map(renderedPost => renderedPost.post);
		let creator;
		if (!this.hasMultipleAuthors || !this.hasMultipleAuthorsPerUser[user.id]) {
			creator = this.postCreators.find(creator => creator.id === posts[0].creatorId);
		}
		const mentioningAuthor = this.mentionsPerUser[user.id] ?
			this.postCreators.find(creator => creator.id === this.mentionsPerUser[user.id]) :
			null;
		const options = {
			logger: this.logger,
			sender: this.sender,
			content: html,
			user,
			creator,
			mentioningAuthor,
			stream: this.stream,
			team: this.team,
			members: this.allMembers,
			postCreators: this.postCreators
		};
		try {
			this.logger.log(`Sending email notification to ${user.email}, posts from ${posts[0].id} to ${posts[posts.length-1].id}`);
			await new EmailNotificationSender().sendEmailNotification(options, this.outboundEmailServer.config);
		}
		catch (error) {
			let message;
			if (error instanceof Error) {
				message = `${error.message}\n${error.stack}`; 
			}
			else {
				message = JSON.stringify(error);
			}
			this.logger.warn(`Unable to send email notification to ${user.email}: ${message}`);
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
		const posts = this.renderedPostsPerUser[user.id];
		const lastPost = posts[posts.length - 1].post;
		const op = { 
			$set: {
				[`lastEmailsSent.${this.stream.id}`]: lastPost.seqNum
			} 
		};
		if (!user.hasReceivedFirstEmail) {
			op.$set.hasReceivedFirstEmail = true; 
		}
		try {
			await this.data.users.updateDirect(
				{ id: this.data.users.objectIdSafe(user.id) },
				op
			);
		}
		catch (error) {
			this.logger.warn(`Unable to update user ${user.id} after email notification: ${JSON.stringify(error)}`);
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
				session.updatedAt > now - this.outboundEmailServer.config.sessionAwayTimeout
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
		return !mutedStreams[stream.id];
	}

	// does this post mention the current user?
	postMentionsUser (post, user) {
		const mentionedUserIds = post.mentionedUserIds || [];
		return mentionedUserIds.includes(user.id);
	}

	// get the emote for this post, if it starts with /me (basically the rest of the post)
	getPostEmote (post) {
		const codemark = post.codemarkId ?
			this.codemarks.find(codemark => codemark.id === post.codemarkId) :
			null;
		const text = (codemark && codemark.text) || post.text || '';
		const match = text.match(/^\/me\s+(.*)/);
		post.hasEmote = match && match.length > 1 && match[1];
		return post.hasEmote;
	}

	// get the non-comment codemark for this post, since this gives us an activity line like an emote
	getNonCommentCodemark (post) {
		const codemark = post.codemarkId ?
			this.codemarks.find(codemark => codemark.id === post.codemarkId) :
			null;
		if (codemark && codemark.type !== 'comment') {
			post.nonCommentCodemark = codemark;
		}
		return post.nonCommentCodemark;
	}
}

module.exports = EmailNotificationProcessor;
