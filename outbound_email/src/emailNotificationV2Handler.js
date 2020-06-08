'use strict';

const ReplyRenderer = require('./replyRenderer');
const CodemarkRenderer = require('./codemarkRenderer');
const ReviewRenderer = require('./reviewRenderer');
const EmailNotificationV2Renderer = require('./emailNotificationV2Renderer');
const EmailNotificationV2Sender = require('./emailNotificationV2Sender');
const Utils = require('./utils');
const TokenHandler = require('./server_utils/token_handler');
const Juice = require('juice');

const DEFAULT_TIME_ZONE = 'America/New_York';

class EmailNotificationV2Handler {

	constructor (options) {
		Object.assign(this, options);
		this.logger = this.logger || console;
	}

	async handleMessage (message) {
		this.message = message;
		this.log(`Processing an email notification request: ${JSON.stringify(this.message)}`);
		this.processingStartedAt = Date.now();
		try {
			await this.getPost();					// get the triggering post
			await this.getParentPost();				// get the parent post to the triggering post, if needed
			await this.getCodemarkOrReview();		// get the codemark or review for the triggering post
			await this.getRelatedCodemarks();		// get any codemarks related to this one
			await this.getMarkers();				// get markers associated with all codemarks
			await this.getRepos();					// get repos associated with all markers
			await this.getFileStreams();			// get file streams associated with all markers
			await this.getStream();					// get the stream the post belongs to
			await this.getTeam();					// get the team that owns the stream that owns the post
			await this.getAllMembers();				// get all members of the team
			if (await this.filterByPreference()) {	// filter to those who haven't turned email notifications off
				return; // indicates no emails will be sent, so just abort
			}
			if (await this.filterByActivity()) {	// filter to those who may have activity that keeps them from getting notifications
				return; // indicates no emails will be sent, so just abort
			}
			if (await this.renderPost()) {			// render the HTML for the reply, codemark, or review represented by this post
				return; // indicates no emails will be sent, so just abort
			}
			await this.personalizePerUser();		// personalize the rendered post as needed
			await this.renderPerUser();				// render each user's email
			await this.sendNotifications();			// send out the notifications
			await this.updateUsers();				// update user info concerning email notifications
		}
		catch (error) {
			let message;
			if (error instanceof Error) {
				message = `${error.message}\n${error.stack}`;
			}
			else {
				message = JSON.stringify(error);
			}
			return this.warn(`Email notification handling failed: ${message}`);
		}
		this.log(`Successfully processed an email notification request: ${JSON.stringify(this.message)}`);
	}

	// get the triggering post, and the parent post if needed
	async getPost () {
		this.post = await this.data.posts.getById(this.message.postId);
		if (!this.post) {
			throw `post ${this.message.postId} not found`;
		}
	}

	// get the parent post to the triggering post, if needed
	async getParentPost () {
		if (!this.post.parentPostId) { return; }
		this.parentPost = await this.data.posts.getById(this.post.parentPostId);
		if (!this.post) {
			throw `parent post ${this.post.parentPostId} not found`;
		}
	}

	// get the codemark or review associated with the triggering post, as needed
	async getCodemarkOrReview () {
		if (this.post.codemarkId) {
			this.codemark = await this.data.codemarks.getById(this.post.codemarkId);
			if (!this.codemark) {
				throw `codemark ${this.post.codemarkId} not found`;
			}
		}
		else if (this.post.reviewId) {
			this.review = await this.data.reviews.getById(this.post.reviewId);
			if (!this.review) {
				throw `review ${this.post.reviewId} not found`;
			}
		}

		if (this.parentPost && this.parentPost.reviewId) {
			this.parentReview = await this.data.reviews.getById(this.parentPost.reviewId);
		}
		else if (this.parentPost && this.parentPost.parentPostId) {
			this.grandparentPost = await this.data.posts.getById(this.parentPost.parentPostId);
			if (this.grandparentPost.reviewId) {
				this.parentReview = await this.data.reviews.getById(this.grandparentPost.reviewId);
			}
		}
	}

	// get the related codemarks, including the parent codemark, as needed
	async getRelatedCodemarks () {
		let codemarkIds = [];
		if (this.parentPost && this.parentPost.codemarkId) {
			codemarkIds.push(this.parentPost.codemarkId);
		}
		if (this.codemark && this.codemark.relatedCodemarkIds) {
			codemarkIds = [...codemarkIds, ...this.codemark.relatedCodemarkIds];
		}
		if (codemarkIds.length === 0) {
			return;
		}

		this.relatedCodemarks = await this.data.codemarks.getByIds(codemarkIds);
		if (this.relatedCodemarks.length !== codemarkIds.length) {
			throw `unable to find all related codemarks to ${this.post.id}`;
		}
		if (this.parentPost && this.parentPost.codemarkId) {
			const index = this.relatedCodemarks.findIndex(relatedCodemark => {
				return relatedCodemark.id === this.parentPost.codemarkId;
			});
			if (index === -1) {
				throw `unable to find parent codemark ${this.parentPost.codemarkId}`;
			}
			this.parentCodemark = this.relatedCodemarks[index];
			this.relatedCodemarks.splice(index, 1);
		}

		if (this.parentCodemark && this.parentCodemark.reviewId) {
			this.parentReview = await this.data.reviews.getById(this.parentCodemark.reviewId);
		}
	}

	// get the markers associated with all the codemarks or the review
	async getMarkers () {
		const allCodemarks = (this.codemark && this.relatedCodemarks) || [];
		if (this.codemark) {
			allCodemarks.push(this.codemark);
		}
		if (this.parentCodemark) {
			allCodemarks.push(this.parentCodemark);
		}
		if (this.review) {
			allCodemarks.push(this.review); // not a codemark, but still has markerIds
		}
		let markerIds = [];
		for (let codemark of allCodemarks) {
			markerIds = [...markerIds, ...(codemark.markerIds || [])];
		}

		this.markers = await this.data.markers.getByIds(markerIds);
	}

	// get the repos associated with all the markers
	async getRepos () {
		let repoIds = [];
		if (this.post.codemarkId) {
			repoIds = this.markers.reduce((repoIds, marker) => {
				if (marker.repoId && !repoIds.includes(marker.repoId)) {
					repoIds.push(marker.repoId);
				}
				return repoIds;
			}, []);
		}
		else if (this.post.reviewId) {
			repoIds = this.review.reviewChangesets.reduce((repoIds, reviewChangeset) => {
				if (reviewChangeset.repoId && !repoIds.includes(reviewChangeset.repoId)) {
					repoIds.push(reviewChangeset.repoId);
				}
				return repoIds;
			}, []);
		}
		else if (this.parentReview) {
			repoIds = this.parentReview.reviewChangesets.reduce((repoIds, reviewChangeset) => {
				if (reviewChangeset.repoId && !repoIds.includes(reviewChangeset.repoId)) {
					repoIds.push(reviewChangeset.repoId);
				}
				return repoIds;
			}, []);
		}

		if (repoIds.length === 0) {
			return;
		}

		this.repos = await this.data.repos.getByIds(repoIds);
	}

	// get the file-streams representing all the code blocks of all the codemarks
	async getFileStreams () {
		const fileStreamIds = this.markers.reduce((streamIds, marker) => {
			if (marker.fileStreamId && !streamIds.includes(marker.fileStreamId)) {
				streamIds.push(marker.fileStreamId);
			}
			return streamIds;
		}, []);
		if (fileStreamIds.length === 0) {
			return;
		}
		this.fileStreams = await this.data.streams.getByIds(fileStreamIds);
	}

	// get the stream associated with ths post
	async getStream () {
		this.stream = await this.data.streams.getById(this.post.streamId);
		if (!this.stream) {
			throw `stream ${this.post.streamId} not found`;
		}
	}

	// get the team that owns the stream that owns the post
	async getTeam () {
		this.team = await this.data.teams.getById(this.stream.teamId);
		if (!this.team) {
			throw `team ${this.stream.teamId} not found`;
		}
	}

	// get all members of the team, and all members of the stream as warranted
	async getAllMembers () {
		this.teamMembers = await this.data.users.getByIds(this.team.memberIds);
		if (this.stream.type === 'file' || this.stream.isTeamStream) {
			this.streamMembers = this.teamMembers;
		}
		else {
			this.streamMembers = this.teamMembers.filter(member => {
				return this.stream.memberIds.indexOf(member.id) !== -1;
			});
		}
	}

	// filter the offline members to those who haven't turned email notifications off
	async filterByPreference () {
		this.toReceiveEmails = this.streamMembers.filter(user => this.userToReceiveEmail(user));
		if (this.toReceiveEmails.length === 0) {
			return true; // short-circuit the flow
		}
	}

	// determine whether the given user wants an email notification for the current post
	userToReceiveEmail (user) {
		// deactivated users never get emails
		if (user.deactivated) {
			this.log(`User ${user.id}:${user.email} is deactivated so will not receive an email notification`);
			return false;
		}

		// first, if the user has emails turned off as delivery preference, don't send an email
		const preferences = user.preferences || {};
		if (preferences.notificationDelivery === 'off' || preferences.notificationDelivery === 'toastOnly') {
			this.log(`User ${user.id}:${user.email} has notification delivery of emails turned off`);
			return false;
		}
		
		// next, check if they're following the thing the post refers to
		const thingToFollow = this.post.parentPostId ?
			(this.parentReview || this.parentCodemark) :
			(this.review || this.codemark);
		const followerIds = (thingToFollow && thingToFollow.followerIds) || [];
		if (followerIds.indexOf(user.id) !== -1) {
			return true;
		}

		// otherwise, only send emails if they are mentioned
		const mentionedUserIds = this.post.mentionedUserIds || [];
		const mentioned = this.stream.type === 'direct' || mentionedUserIds.indexOf(user.id) !== -1;
		if (!mentioned) {
			this.log(`User ${user.id}:${user.email} is not following and is not mentioned so will not receive an email notification`);
			return false;
		}

		return true;
	}

	// based on when last emails were sent, last activity, etc., determine which users may not get an email notification
	async filterByActivity () {
		this.toReceiveEmails = this.toReceiveEmails.filter(user => {
			const lastReads = user.lastReads || {};
			const lastReadSeqNum = lastReads[this.stream.id] || 0;
			const lastActivityAt = user.lastActivityAt || null;
			const lastEmailsSent = user.lastEmailsSent || {};
			const lastEmailSent = lastEmailsSent[this.stream.id] || 0;

			// post creator should never receive a notification
			if (this.post.creatorId === user.id) {
				this.log(`User ${user.id}:${user.email} is the post creator so will not receive an email notification`);
				return false;
			}

			// guard against the user already having been sent an email notification for this post
			else if (this.post.seqNum <= lastEmailSent) {
				this.log(`User ${user.id}:${user.email} is caught up on email notifications for this stream so will not receive an email notification`);
				return false;
			}

			// otherwise, if the user has no activity, it's either because they've never logged on,
			// or because they haven't logged on since we started saving activity ... in either case,
			// send posts through the last sequence number they've read
			else if (lastActivityAt === null) {
				if (this.post.seqNum <= lastReadSeqNum) {
					this.log(`User ${user.id}:${user.email} has read all the posts in this stream so will not receive an email notification`);
					return false;
				}
				else {
					return true;
				}
			}

			// otherwise, send since the user's last activity
			else if (this.post.createdAt < lastActivityAt) {
				this.log(`User ${user.id}:${user.email} has activity since this post was created so will not receive an email notification`);
				return false;
			}
			else {
				return true;
			}
		});
		if (this.toReceiveEmails.length === 0) {
			return true; // short-circuit the flow
		}
	}

	// render the HTML needed for an individual post
	async renderPost () {
		const creator = this.teamMembers.find(member => member.id === this.post.creatorId);
		this.renderOptions = {
			post: this.post,
			parentPost: this.parentPost,
			codemark: this.parentCodemark || this.codemark,
			review: this.parentReview || this.review,
			markers: this.markers,
			fileStreams: this.fileStreams,
			repos: this.repos,
			members: this.teamMembers,
			team: this.team,
			stream: this.stream,
			mentionedUserIds: this.post.mentionedUserIds || [],
			relatedCodemarks: this.relatedCodemarks,
			creator
		};
		// HACK ugh, don't want to do this here...	
		this.renderOptions.clickUrl = Utils.getIDEUrl(((this.renderOptions.review || this.renderOptions.codemark) || {}).permalink, null);
		if (this.post.parentPostId) {
			const creatorId = (this.parentCodemark || this.parentReview).creatorId;
			this.renderOptions.parentObjectCreator = this.teamMembers.find(member => member.id === creatorId);

			if (this.parentReview) {
				if (this.codemark) {
					// new codemark for a review
					this.renderOptions.parentObject = this.parentReview;
					const reviewContent = new ReviewRenderer().renderCollapsed(this.renderOptions);
					const codemarkContent = new CodemarkRenderer().render({ ...this.renderOptions, 
						suppressNewContent: true 
					});					
					this.renderedHtml = new ReplyRenderer().renderContentAsReply(this.renderOptions, reviewContent, codemarkContent);
					return;
				}
				else if (this.parentCodemark) {
					// new reply to a codemark in a review
					// here, we aren't showing the full review object, just the review header in the codemark
					this.renderOptions.parentObject = this.parentCodemark;					
					const parentCodemark = new CodemarkRenderer().render({ ...this.renderOptions, 
						includeActivity: true,
						suppressNewContent: true, 
						includeReviewSection: true
					});
					this.renderedHtml = new ReplyRenderer().render(this.renderOptions, parentCodemark);					
					return;
				}
				else {
					// new reply to a review
					this.renderOptions.parentObject = this.parentReview;
					const reviewContent = new ReviewRenderer().renderCollapsed(this.renderOptions);
					this.renderedHtml = new ReplyRenderer().render(this.renderOptions, reviewContent);
					return;
				}
			}			
			else if (this.parentCodemark) {
				// new reply to a codemark
				this.renderOptions.parentObject = this.parentCodemark;
				const codemarkContent = new CodemarkRenderer().renderCollapsed({...this.renderOptions, includeActivity: true});
				this.renderedHtml = new ReplyRenderer().render(this.renderOptions, codemarkContent);
				return;
			}
		}
		else if (this.codemark) {
			// new codemark
			this.renderedHtml = new CodemarkRenderer().render(this.renderOptions);
			return;
		}
		else if (this.review) {
			// new review
			this.renderedHtml = new ReviewRenderer().render(this.renderOptions);
			return;
		}
		else {
			this.warn(`Post ${this.post.id} is not a reply and does not refer to a codemark; email notifications for plain posts are no longer supported; how the F did we get here?`);
			return true;
		}
	}

	// personalize each user's rendered post as needed ... the rendered post needs to be
	// personalized if the users are in different time zones
	async personalizePerUser () {
		this.renderedPostPerUser = {};
		for (let user of this.toReceiveEmails) {
			await this.personalizeRenderedPostPerUser(user);
		}
	}

	// personalize the rendered post for the given user, by making a copy of the
	// rendered html, and doing field substitution of timestamp as needed
	async personalizeRenderedPostPerUser (user) {
		let renderedHtmlForUser = this.renderedHtml;

		// format the timestamp of this post with timezone dependency
		const datetime = Utils.formatTime(this.post.createdAt, user.timeZone || DEFAULT_TIME_ZONE);
		renderedHtmlForUser = renderedHtmlForUser.replace(/\{\{\{datetime\}\}\}/g, datetime);

		// also format the timestamp of the parent codemark as needed
		if (this.parentCodemark || this.parentReview) {
			const createdAt = (this.parentCodemark || this.parentReview).createdAt;
			const parentObjectDatetime = Utils.formatTime(createdAt, user.timeZone || DEFAULT_TIME_ZONE);
			renderedHtmlForUser = renderedHtmlForUser.replace(/\{\{\{parentObjectDatetime\}\}\}/g, parentObjectDatetime);
		}

		// for users who are mentioned, special formatting applies to the user receiving the email
		const regExp = new RegExp(`\\{\\{\\{mention${user.id}\\}\\}\\}`, 'g');
		renderedHtmlForUser = renderedHtmlForUser.replace(regExp, 'mention-me');
		renderedHtmlForUser = renderedHtmlForUser.replace(/\{\{\{mention.+?\}\}\}/g, 'mention');

		/*
		// for DMs, the list of usernames who can "see" the codemark excludes the user 
		if (this.stream.type === 'direct') {
			const visibleTo = this.getVisibleTo(user);
			renderedHtmlForUser = renderedHtmlForUser.replace(/\{\{\{usernames\}\}\}/g, visibleTo);
		}
		*/

		this.renderedPostPerUser[user.id] = renderedHtmlForUser;
	}

	/*
	// get the list of usernames in a DM who can see the codemark, excluding current user
	getVisibleTo (user) {
		const streamMembers = [...(this.stream.memberIds || [])];
		const userIndex = streamMembers.findIndex(id => user && id === user.id);
		if (userIndex !== -1) {
			streamMembers.splice(userIndex, 1);
		}
		if (streamMembers.length === 0) {
			return 'yourself';
		}

		const usernames = [];
		for (let memberId of streamMembers) {
			const member = this.allMembers.find(member => member.id === memberId);
			if (member) {
				usernames.push(member.username);
			}
		}

		if (usernames.length > 3) {
			const nOthers = usernames.length - 2;
			return `${usernames.slice(0, 2).join(', ')} & ${nOthers} others`;
		}
		else {
			return usernames.join(', ');
		}
	}
	*/

	// render each user's email in html
	async renderPerUser () {
		this.renderedEmails = [];
		for (let user of this.toReceiveEmails) {
			await this.renderEmailForUser(user);
		}
	}

	// render a single email for the given user
	async renderEmailForUser (user) {
		const { codemark, review } = this.renderOptions;
		const thingToUnfollow = this.parentReview || codemark || review;
		const isReview = !!(this.parentReview || review);
		const unfollowLink = this.getUnfollowLink(user, thingToUnfollow, isReview);
		const userBeingAddedToTeam = (this.message.usersBeingAddedToTeam || []).includes(user.id);
		Object.assign(this.renderOptions, {
			content: this.renderedPostPerUser[user.id],
			unfollowLink,
			inboundEmailDisabled: this.outboundEmailServer.config.inboundEmailDisabled,
			styles: this.pseudoStyles,	// only pseudo-styles go in the <head>
			needButtons: !!this.parentPost || review || (codemark.markerIds || []).length === 1,
			isReply: !!this.post.parentPostId,
			userIsRegistered: user.isRegistered,
			inviteCode: user.inviteCode,
			ideLinks: this.getIDELinks(),
			userBeingAddedToTeam,
			teamName: this.team.name
		});
		let html = new EmailNotificationV2Renderer().render(this.renderOptions);
		html = html.replace(/[\t\n]/g, '');

		// this puts our styles inline, which is needed for gmail's display of larger emails
		html = Juice(`<style>${this.styles}</style>${html}`);

		this.renderedEmails.push({ user, html });
	}

	// get the links appropriate for each IDE the user might want to install
	getIDELinks () {
		const ideLinks = {
			'VS Code': 'https://marketplace.visualstudio.com/items?itemName=CodeStream.codestream',
			'Visual Studio': 'https://marketplace.visualstudio.com/items?itemName=CodeStream.codestream-vs',
			'JetBrains': 'https://plugins.jetbrains.com/plugin/12206-codestream',
			'Atom': 'https://atom.io/packages/codestream'
		};
		const links = [];
		for (let ide in ideLinks) {
			const href = `<a clicktracking="off" href="${ideLinks[ide]}">${ide}</a>`;
			links.push(href);
		}
		const allLinks = links.slice(0, links.length - 1).join(', ') + ' or ' + links[links.length - 1];
		return allLinks;
	}

	// get the "unfollow" link for a given user and codemark or review
	getUnfollowLink (user, thingToUnfollow, isReview) {
		const expiresIn = this.expiresIn || 30 * 24 * 60 * 60 * 1000; // one month
		const expiresAt = Date.now() + expiresIn;
		const token = new TokenHandler(this.outboundEmailServer.config.tokenSecret).generate(
			{
				uid: user.id
			},
			'unf',
			{
				expiresAt
			}
		);
		const reviewPathPart = isReview ? 'review/' : '';
		return `${this.outboundEmailServer.config.apiUrl}/no-auth/unfollow-link/${reviewPathPart}${thingToUnfollow.id}?t=${token}`;
	}

	// send all the email notifications 
	async sendNotifications () {
		await Promise.all(this.renderedEmails.map(async userAndHtml => {
			await this.sendNotificationToUser(userAndHtml);
		}));
	}

	// send an email notification to the given user
	async sendNotificationToUser (userAndHtml) {
		const { user, html } = userAndHtml;
		const isReply = !!this.post.parentPostId;
		const codemark = isReply ? this.parentCodemark : this.codemark;
		const review = isReply ? this.parentReview : this.review;

		// figure out the post that a reply to the email will be a child of, this is pretty complicated logic
		// and should be altered very carefully
		let replyToPostId;
		if (isReply) {
			if (this.codemark) {
				// if the reply has a codemark, then replies to this post should be to the codemark, 
				// in other words, they would create a new thread of nested replies
				replyToPostId = this.codemark.postId;
			}
			else {
				// otherwise the reply should go to the same parent as the post that is generating the 
				// notifications, in other words, it adds to the existing thread
				replyToPostId = this.post.parentPostId;
			}
		}
		else if (this.codemark || this.review) {
			// for non-replies, replies via email get attached to the codemark or review that is
			// generating the email notification
			replyToPostId = (this.codemark || this.review).postId;
		}
		else {
			// this shouldn't really happen since it's not really possible to create a post without a 
			// codemark or review, but we put it here for posterity and sanity
			replyToPostId = this.post.id;
		}

		const creatorId = isReply ? this.post.creatorId : (codemark || review).creatorId;
		const creator = this.teamMembers.find(member => member.id === creatorId);
		const options = {
			sender: this.sender,
			content: html,
			user,
			creator,
			codemark,
			review,
			stream: this.stream,
			team: this.team,
			replyToPostId,
			isReply
		};
		const which = review ? 'review' : 'codemark';
		try {
			this.logger.log(`Sending ${which}-based email notification to ${user.email}, post ${this.post.id}, isReply=${isReply}...`);
			await new EmailNotificationV2Sender().sendEmailNotification(options, this.outboundEmailServer.config);
		}
		catch (error) {
			let message;
			if (error instanceof Error) {
				message = `${error.message}\n${error.stack}`;
			}
			else {
				message = JSON.stringify(error);
			}
			this.logger.warn(`Unable to send ${which}-based email notification to ${user.email}: ${message}`);
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
		const op = {
			$set: {
				[`lastEmailsSent.${this.stream.id}`]: this.post.seqNum
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

	log (message) {
		this.logger.log(message);
	}

	warn (message) {
		this.logger.warn(message);
	}
}

module.exports = EmailNotificationV2Handler;
