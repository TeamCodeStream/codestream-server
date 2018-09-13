// handle sending email notifications in response to a new post

'use strict';

const Indexes = require('./indexes');
const PostRenderer = require('./post_renderer');
const EmailNotificationRenderer = require('./email_notification_renderer');
const SessionManager = require(process.env.CS_API_TOP + '/modules/users/session_manager');

// make eslint happy
/* globals Intl */

class EmailNotificationSender {

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
		this.team = await this.request.data.teams.getById(this.stream.get('teamId'));
	}

	// get the repo that owns the stream that owns the post
	async getRepo () {
		if (this.stream.get('repoId')) {
			this.repo = await this.request.data.repos.getById(this.stream.get('repoId'));
		}
	}

	// get all members of the team
	async getAllMembers () {
		let memberIds;
		if (this.userId) {
			memberIds = [this.userId];	// this is for the case where a user goes away
		}
		if (this.stream.get('type') === 'file' || this.stream.get('isTeamStream')) {
			memberIds = this.team.get('memberIds');
		}
		else {
			memberIds = this.stream.get('memberIds');
		}
		this.allMembers = await this.request.data.users.getByIds(memberIds);
	}

	// get the team members that are currently subscribed to the repo channel for the
	// repo to which the stream belongs
	async getRepoSubscribedMembers () {
		if (!this.repo) {	// not applicable to non file-type streams
			return;
		}
		// query the messager service (pubnub) for who is subscribed to the team channel
		const channel = 'repo-' + this.repo.id;
		try {
			this.onlineUserIdsForRepo = await this.request.api.services.messager.getSubscribedUsers(
				channel,
				{ request: this.request }
			);
		}
		catch (error) {
			throw `Unable to obtain subscribed users for channel ${channel}: ${error}`;
		}
		this.request.log(`These users are online for repo ${this.repo.id}: ${this.onlineUserIdsForRepo}`);
	}

	// get the team members that are currently subscribed to the team channel (they are online)
	async getTeamSubscribedMembers () {
		// query the messager service (pubnub) for who is subscribed to the team channel
		const channel = 'team-' + this.team.id;
		try {
			this.onlineUserIdsForTeam = await this.request.api.services.messager.getSubscribedUsers(
				channel
			);
		}
		catch (error) {
			throw `Unable to obtain subscribed users for channel ${channel}: ${error}`;
		}
		this.request.log(`These users are online for team ${this.team.id}: ${this.onlineUserIdsForTeam}`);
	}

	// get the user objects for the offline members
	async getOfflineMembers () {
		this.offlineMembers = this.allMembers.filter(member => {
			// if this is a non-file type stream, then if the user is offline for the team,
			// then they are truly offline ... there is no sense of whether they have the repo open or not
			if (this.stream.type !== 'file') {
				if (!this.onlineUserIdsForTeam.includes(member.id)) {
					return true;
				}
			}
			else {
				// for file-type streams, if they show as offline according to pubnub,
				// they are truly offline
				if (!this.onlineUserIdsForRepo.includes(member.id)) {
					return true;
				}
			}
			const isActive = new SessionManager({
				user: member,
				request: this.request
			}).hasActiveSession();
			if (isActive) {
				this.request.log(`User ${member.get('email')} is active so is not eligible for an email notification`);
			}
			return !isActive;
		});
	}

	// filter the offline members to those who haven't turned email notifications off
	async filterByPreference () {
		this.needPostsFromSeqNum = -1;
		this.toReceiveEmails = this.offlineMembers.filter(user => this.userWantsEmail(user));
		if (this.toReceiveEmails.length === 0) {
			return true; // short-circuit the flow
		}
		// record whether all the users to receive emails are in the same timezone,
		// if they are, then we don't need to personalize the rendering of each email,
		// since we can make all the timestamps the same
		const firstUser = this.toReceiveEmails[0];
		this.hasMultipleTimeZones = this.toReceiveEmails.find(user => user.get('timeZone') !== firstUser.get('timeZone'));
	}

	// determine whether the givenn user wants an email notification for the current post
	userWantsEmail (user) {
		// deactivated users never get emails
		if (user.get('deactivated')) {
			return false;
		}

		// note that we assume the user is mentioned in the posts ... we don't have the posts yet
		// (and we don't know which ones to get until we know which users want emails), so we are
		// optimistic that the user will want a notification ... then, after we get the posts, we
		// can filter down to those users who really want an email based on mentions
		let wantsEmail = user.wantsEmail(this.stream, true);
		if (wantsEmail) {
			const lastReadSeqNum = user.get('lastReads') && user.get('lastReads')[this.stream.id];
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
			this.request.log(`User ${user.id}:${user.get('email')} has email notifications turned off for this stream`);
		}
		return wantsEmail;
	}

	// get the most recent posts in the stream, by sequence number
	async getPosts () {
		const query = {
			streamId: this.stream.id,
			seqNum: { $gte: this.needPostsFromSeqNum }
		};
		this.posts = await this.request.data.posts.getByQuery(
			query,
			{
				databaseOptions: {
					sort: { seqNum: -1 },
					limit: this.request.api.config.email.maxPostsPerEmail,
					hint: Indexes.bySeqNum
				}
			}
		);
		this.request.log(`Fetched ${this.posts.length} posts for email notifications`);
	}

	// get any posts earlier than the triggering post, that may be representative of the user
	// having gone "away" between the triggering post and their last read post
	async getEarlierPosts () {
		// no need to get earlier posts if we've already reached maximum
		const maxPosts = this.request.api.config.email.maxPostsPerEmail;
		if (this.posts.length === maxPosts) {
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
		const needActivityBefore = earliestPost ? earliestPost.get('createdAt') : Date.now();
		if (!this.offlineMembers.find(user => {
			const lastEmailsSent = user.get('lastEmailsSent') || {};
			const lastSeqNumSent = lastEmailsSent[this.stream.id] || 0;
			return (
				user.get('lastActivityAt') && 
				user.get('lastActivityAt') < needActivityBefore &&
				(
					!earliestPost ||
					lastSeqNumSent < earliestPost.get('seqNum') - 1
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
				$lt: earliestPost.get('seqNum')
			};
		}
		const earlierPosts = await this.request.data.posts.getByQuery(
			query,
			{
				databaseOptions: {
					sort: { seqNum: -1 },
					limit: maxPosts - this.posts.length,
					hint: Indexes.bySeqNum
				}
			}
		);
		this.request.log(`Fetched additional ${earlierPosts.length} posts due to away timers`);
		this.posts = [...this.posts, ...earlierPosts];
	}

	// characterize the posts we have by filtering out any deactivated ones, determining whether we have
	// multiple authors represented, and whether we have emojis present, all of which affect later treatment
	async characterizePosts () {
		// filter out any deactivated posts, and short-circuit if we don't have any left
		this.posts = this.posts.filter(post => !post.get('deactivated'));
		if (this.posts.length === 0) {
			this.request.log('Aborting email notifications, all posts are deactivated');
			return true;
		}

		// record whether we have multiple authors represented in the posts
		const firstPost = this.posts[0];
		this.hasMultipleAuthors = this.posts.find(post => post.get('creatorId') !== firstPost.get('creatorId'));
		
		// record whether we have any emotes represented in the posts 
		// (which must be displayed even if we would otherwise suppress the author line)
		this.hasEmotes = this.posts.find(post => post.getEmote());
	}

	// get the markers representing the code blocks of the posts
	async getMarkers () {
		this.codeBlocks = this.posts.reduce((codeBlocks, post) => {
			if (post.get('codeBlocks')) {
				codeBlocks = [...codeBlocks, ...post.get('codeBlocks')];
			}
			return codeBlocks;
		}, []);
		this.markerIds = this.codeBlocks.map(codeBlock => codeBlock.markerId);
		this.markers = await this.request.data.markers.getByIds(this.markerIds);
	}

	// get the streams representing the code blocks of the posts
	async getStreams () {
		this.streamIds = this.markers.reduce((streamIds, marker) => {
			if (!streamIds.includes(marker.get('streamId'))) {
				streamIds.push(marker.get('streamId'));
			}
			return streamIds;
		}, []);
		this.streams = await this.request.data.streams.getByIds(this.streamIds);
	}

	// get the repos representing the code blocks of the posts
	async getRepos () {
		this.repoIds = this.streams.reduce((repoIds, stream) => {
			if (!repoIds.includes(stream.get('repoId'))) {
				repoIds.push(stream.get('repoId'));
			}
			return repoIds;
		}, []);
		this.repos = await this.request.data.repos.getByIds(this.repoIds);
	}

	// get the parent post to any post in the array of posts to go in the email notification,
	// for those posts that are replies
	async getParentPosts () {
		const parentPostIds = this.posts.reduce((ids, post) => {
			if (post.get('parentPostId')) {
				ids.push(post.get('parentPostId'));
			}
			return ids;
		}, []);
		if (parentPostIds.length === 0) {
			return; // no replies!
		}
		this.parentPosts = await this.request.data.posts.getByIds(parentPostIds);
	}

	// get the creators of all the posts, gleaned from the members
	async getPostCreators () {
		const creatorIds = this.posts.reduce((ids, post) => {
			if (!ids.includes(post.get('creatorId'))) {
				ids.push(post.get('creatorId'));
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
		const creator = this.postCreators.find(creator => creator.id === post.get('creatorId'));
		let parentPost;
		if (post.get('parentPostId')) {
			parentPost = this.parentPosts.find(parentPost => parentPost.id === post.get('parentPostId'));
		}
		const firstUserTimeZone = this.toReceiveEmails[0].get('timeZone') || Intl.DateTimeFormat().resolvedOptions().timeZone;
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
		const lastReadSeqNum = user.get('lastReads')[this.stream.id] || 0;
		const lastActivityAt = user.get('lastActivityAt') || null;
		const lastEmailsSent = user.get('lastEmailsSent') || {};
		const lastEmailSent = lastEmailsSent[this.stream.id] || 0;

		const lastReadPostIndex = this.posts.findIndex(post => {
			// look back for any posts authored by this user, as a failsafe
			if (post.get('creatorId') === user.id) {
				return true;
			}

			// otherwise look for posts already sent in an email notification
			else if (post.get('seqNum') <= lastEmailSent) {
				return true;
			}

			// otherwise, if the user has no activity, it's either because they've never logged on,
			// or because they haven't logged on since we started saving activity ... in either case,
			// send posts through the last sequence number they've read
			else if (lastActivityAt === null) {
				return post.get('seqNum') <= lastReadSeqNum;
			}

			// otherwise, send any posts since the user's last activity
			else {
				return post.get('createdAt') < lastActivityAt;
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

		if (this.stream.get('type') === 'direct') {
			// direct messages are treated like mentions
			this.mentionsPerUser[user.id] = true;
		}
		else {
			// otherwise, need to look through the posts per user
			this.renderedPostsPerUser[user.id].find(renderedPost => {
				if (renderedPost.post.mentionsUser(user)) {
					this.mentionsPerUser[user.id] = renderedPost.post.get('creatorId');
					return true;
				}
			});
		}

		const firstPost = this.renderedPostsPerUser[user.id][0].post;
		this.hasMultipleAuthorsPerUser[user.id] = this.renderedPostsPerUser[user.id].find(renderedPost => {
			return renderedPost.post.get('creatorId') !== firstPost.get('creatorId');
		});
		this.hasEmotesPerUser[user.id] = this.renderedPostsPerUser[user.id].find(renderedPost => {
			return renderedPost.post.getEmote();
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
		this.renderedPostsPerUser[user.id].forEach(renderedPost => {
			let { html, post } = renderedPost;

			// if the user has multiple authors represented in the posts they are getting
			// in their email, we show the author usernames, otherwise hide them
			const suppressAuthor = !this.hasMultipleAuthorsPerUser[user.id] && !this.hasEmotesPerUser[user.id];
			let authorSpan = '';
			if (!suppressAuthor) {
				const creator = this.postCreators.find(creator => creator.id === post.get('creatorId'));
				if (creator) {
					authorSpan = PostRenderer.renderAuthorSpan(creator, post.getEmote());
				}
			}
			html = html.replace(/\{\{\{authorSpan\}\}\}/g, authorSpan);

			// format the timestamp of this post with timezone dependency
			const datetime = PostRenderer.formatTime(post.get('createdAt'), user.get('timeZone'));
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
			!user.wantsEmail(this.stream, !!this.mentionsPerUser[user.id])
		) {
			// renderedPosts.length should not be 0, but this can still happen because at the
			// time we determined who preferred getting emails, we didn't have the posts, so
			// we didn't know if the user was mentioned, so we couldn't base our determination
			// on whether the user was mentioned ... now we can
			this.request.log(`User ${user.id}:${user.get('email')} has no posts to render, or is not mentioned, or does not want email notifications`);
			return;
		}
		const postsHtml = renderedPosts.map(renderedPost => renderedPost.html);
		const offlineForRepo = (
			this.stream.get('type') === 'file' &&
			this.onlineUserIdsForTeam.includes(user.id)
		); // online for team, but offline for repo
		let html = new EmailNotificationRenderer().render({
			user,
			posts: postsHtml,
			team: this.team,
			repo: this.repo,
			stream: this.stream,
			mentioned: !!this.mentionsPerUser[user.id],
			streams: this.streams,
			offlineForRepo,
			supportEmail: this.request.api.config.email.supportEmail
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
			creator = this.postCreators.find(creator => creator.id === posts[0].get('creatorId'));
		}
		const mentioningAuthor = this.mentionsPerUser[user.id] ?
			this.postCreators.find(creator => creator.id === this.mentionsPerUser[user.id]) :
			null;
		let options = {
			request: this.request,
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
			await this.request.api.services.email.sendEmailNotification(options);
		}
		catch (error) {
			this.request.warn(`Unable to send email notification to ${user.get('email')}: ${JSON.stringify(error)}`);
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
				[`lastEmailsSent.${this.stream.id}`]: lastPost.get('seqNum')
			} 
		};
		if (!user.get('hasReceivedFirstEmail')) {
			op.$set.hasReceivedFirstEmail = true; 
		}
		try {
			await this.request.data.users.updateDirect(
				{ _id: this.request.data.users.objectIdSafe(user.id) },
				op
			);
		}
		catch (error) {
			this.request.warn(`Unable to update user ${user.id} after email notification: ${JSON.stringify(error)}`);
		}
	}
}

module.exports = EmailNotificationSender;
