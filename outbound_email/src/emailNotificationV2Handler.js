'use strict';

const Config = require('./config');
const ReplyRenderer = require('./replyRenderer');
const CodemarkRenderer = require('./codemarkRenderer');
const EmailNotificationV2Renderer = require('./emailNotificationV2Renderer');
const EmailNotificationV2Sender = require('./emailNotificationV2Sender');
const Utils = require('./utils');

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
			await this.getPostData();				// get the triggering post, codemark, and markers
			await this.getParentPostData();			// if this is a reply, get the parent post, codemark, and markers
			await this.getStream();					// get the stream the post belongs to
			await this.getTeam();					// get the team that owns the stream that owns the post
			await this.getAllMembers();				// get all members of the team
			if (await this.filterByPreference()) {	// filter to those who haven't turned email notifications off
				return; // indicates no emails will be sent, so just abort
			}
			if (await this.filterByActivity()) {	// filter to those who may have activity that keeps them from getting notifications
				return; // indicates no emails will be sent, so just abort
			}
			await this.getFileStreams();			// get the file-streams representing the markers
			await this.getRelatedCodemarks();		// get any codemarks related to this one
			if (await this.renderPost()) {			// render the HTML for the reply or codemark represented by this post
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

	// get post, codemark, and markers for a given post ID
	async getPostDataById (postId) {
		const postData = { 
			post: null,
			codemark: null,
			markers: []
		};
		
		// get post
		postData.post = await this.data.posts.getById(postId);
		if (!postData.post) {
			throw `post ${postId} not found`;
		}
		else if (postData.post.deactivated) {
			throw `post ${postId} has been deactivated`;
		}

		// get codemark
		if (!postData.post.codemarkId) {
			return postData;
		}
		postData.codemark = await this.data.codemarks.getById(postData.post.codemarkId);
		if (!postData.codemark) {
			throw `codemark ${postData.post.codemarkId} not found`;
		}

		// get markers
		if (!postData.codemark.markerIds || postData.codemark.markerIds.length === 0) {
			return postData;
		}
		postData.markers = await this.data.markers.getByIds(postData.codemark.markerIds);
		if (postData.markers.length !== postData.codemark.markerIds.length) {
			throw `not all markers of ${postData.codemark.markerIds} found`;
		}
		// filter out any markers that have been "moved"
		postData.markers = postData.markers.filter(marker => !marker.supersededByMarkerId);

		return postData;
	}

	// get post, codemark, and markers of the triggering post
	async getPostData () {
		this.postData = await this.getPostDataById(this.message.postId);
	}

	// get post, codemark, and markers of the parent post if the triggering post is a reply
	async getParentPostData () {
		if (this.postData.post.parentPostId) {
			this.parentPostData = await this.getPostDataById(this.postData.post.parentPostId);
		}
	}

	// get the stream associated with ths post
	async getStream () {
		this.stream = await this.data.streams.getById(this.postData.post.streamId);
		if (!this.stream) {
			throw `stream ${this.postData.post.streamId} not found`;
		}
	}

	// get the team that owns the stream that owns the post
	async getTeam () {
		this.team = await this.data.teams.getById(this.stream.teamId);
		if (!this.team) {
			throw `team ${this.stream.teamId} not found`;
		}
	}

	// get all members of the team
	async getAllMembers () {
		let memberIds;
		if (this.stream.type === 'file' || this.stream.isTeamStream) {
			memberIds = this.team.memberIds;
		}
		else {
			memberIds = this.stream.memberIds;
		}
		this.allMembers = await this.data.users.getByIds(memberIds);
	}

	// filter the offline members to those who haven't turned email notifications off
	async filterByPreference () {
		this.toReceiveEmails = this.allMembers.filter(user => this.userToReceiveEmail(user));
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
			this.log(`User ${user.id}:${user.email} is deactivated so will not receive an email notification`);
			return false;
		}

		// first, if this user is not yet registered, we only send emails if they are mentioned
		const mentionedUserIds = this.postData.post.mentionedUserIds || [];
		const mentioned = this.stream.type === 'direct' || mentionedUserIds.indexOf(user.id) !== -1;
		if (!user.isRegistered && !mentioned) {
			this.log(`User ${user.id}:${user.email} is not yet registered and is not mentioned so will not receive an email notification`);
			return false;
		}

		// then, only if they're following
		const codemark = this.postData.post.parentPostId ? this.parentPostData.codemark : this.postData.codemark;
		const followerIds = (codemark && codemark.followerIds) || [];
		if (followerIds.indexOf(user.id) === -1) {
			this.log(`User ${user.id}:${user.email} is not following the associated codemark so will not receive an email notification`);
			return false;
		}

		return true;
	}

	// based on when last emails were sent, last activity, etc., determine which users may not get an email notification
	async filterByActivity () {
		const { post } = this.postData;
		this.toReceiveEmails = this.toReceiveEmails.filter(user => {
			const lastReads = user.lastReads || {};
			const lastReadSeqNum = lastReads[this.stream.id] || 0;
			const lastActivityAt = user.lastActivityAt || null;
			const lastEmailsSent = user.lastEmailsSent || {};
			const lastEmailSent = lastEmailsSent[this.stream.id] || 0;
	
			// post creator should never receive a notification
			if (post.creatorId === user.id) {
				this.log(`User ${user.id}:${user.email} is the post creator so will not receive an email notification`);
				return false;
			}

			// guard against the user already having been sent an email notification for this post
			else if (post.seqNum <= lastEmailSent) {
				this.log(`User ${user.id}:${user.email} is caught up on email notifications for this stream so will not receive an email notification`);
				return false;
			}

			// otherwise, if the user has no activity, it's either because they've never logged on,
			// or because they haven't logged on since we started saving activity ... in either case,
			// send posts through the last sequence number they've read
			else if (lastActivityAt === null) {
				if (post.seqNum <= lastReadSeqNum) {
					this.log(`User ${user.id}:${user.email} has read all the posts in this stream so will not receive an email notification`);
					return false;
				}
				else {
					return true;
				}
			}

			// otherwise, send since the user's last activity
			else if (post.createdAt < lastActivityAt) {
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

	// get the streams representing the code blocks of the posts
	async getFileStreams () {
		const parentMarkers = this.parentPostData && this.parentPostData.markers;
		const markers = [...this.postData.markers, ...(parentMarkers || [])];
		const fileStreamIds = markers.reduce((streamIds, marker) => {
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

	// get any codemarks related to the codemark associated with this post
	async getRelatedCodemarks () {
		const { codemark } = this.postData;
		if (!codemark || !codemark.relatedCodemarkIds || codemark.relatedCodemarkIds.length === 0) {
			return;
		}
		this.relatedCodemarks = await this.data.codemarks.getByIds(codemark.relatedCodemarkIds);
	}

	// render the HTML needed for an individual post
	async renderPost () {
		if (this.postData.post.parentPostId) {
			return this.renderReply();
		}
		else if (this.postData.codemark) {
			return this.renderCodemark();
		}
		else {
			this.warn(`Post ${this.postData.post.id} is not a reply and does not refer to a codemark; email notifications for plain posts are no longer supported; how the F did we get here?`);
			return true;
		}
	}

	// render the HTML needed for a reply
	async renderReply () {
		const creator = this.allMembers.find(member => member.id === this.postData.post.creatorId);
		const firstUserTimeZone = this.toReceiveEmails[0].timeZone || DEFAULT_TIME_ZONE;
		// if all users have the same timezone, use the first one
		const timeZone = this.hasMultipleTimeZones ? null : firstUserTimeZone;
		this.renderedHtml = new ReplyRenderer().render({
			post: this.postData.post,
			creator,
			timeZone,
			members: this.allMembers,
			mentionedUserIds: this.postData.post.mentionedUserIds || []
		});
	}

	// render the HTML needed for a codemark
	async renderCodemark () {
		const creator = this.allMembers.find(member => member.id === this.postData.post.creatorId);
		const firstUserTimeZone = this.toReceiveEmails[0].timeZone || DEFAULT_TIME_ZONE;
		// if all users have the same timezone, use the first one
		const timeZone = this.hasMultipleTimeZones ? null : firstUserTimeZone;
		this.renderedHtml = new CodemarkRenderer().render({
			codemark: this.postData.codemark,
			creator,
			timeZone,
			markers: this.postData.markers,
			fileStreams: this.fileStreams,
			members: this.allMembers,
			relatedCodemarks: this.relatedCodemarks,
			mentionedUserIds: this.postData.post.mentionedUserIds || []
		});
	}

	// personalize each user's rendered post as needed ... the rendered post needs to be
	// personalized if the users are in different time zones
	async personalizePerUser () {
		this.renderedPostPerUser = {};
		if (!this.hasMultipleTimeZones) {
			return;
		}
		for (let user of this.toReceiveEmails) {
			await this.personalizeRenderedPostPerUser(user);
		}
	}

	// personalize the rendered post for the given user, by making a copy of the
	// rendered html, and doing field substitution of timestamp as needed
	async personalizeRenderedPostPerUser (user) {
		const { post } = this.postData;
		// format the timestamp of this post with timezone dependency
		const datetime = Utils.formatTime(post.createdAt, user.timeZone || DEFAULT_TIME_ZONE);
		this.renderedPostPerUser[user.id] = this.renderedHtml.replace(/\{\{\{datetime\}\}\}/g, datetime);
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
		const renderedHtml = this.renderedPostPerUser[user.id] || this.renderedHtml;
		let html = new EmailNotificationV2Renderer().render({
			content: renderedHtml,
			unfollowLink: 'http://cnn.com',
			inboundEmailDisabled: Config.inboundEmailDisabled
		});
		html = html.replace(/[\t\n]/g, '');
		this.renderedEmails.push({ user, html });
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
		const { post } = this.postData;
		const isReply = !!this.postData.post.parentPostId;
		const codemark = isReply ? (this.parentPostData && this.parentPostData.codemark) : this.postData.codemark;
		const creator = this.allMembers.find(member => member.id === codemark.creatorId);
		const options = {
			sender: this.sender,
			content: html,
			user,
			creator,
			codemark,
			stream: this.stream,
			team: this.team,
			isReply
		};
		try {
			this.logger.log(`Sending codemark-based email notification to ${user.email}, post ${post.id}, isReply=${isReply}...`);
			await new EmailNotificationV2Sender().sendEmailNotification(options);
		}
		catch (error) {
			let message;
			if (error instanceof Error) {
				message = `${error.message}\n${error.stack}`; 
			}
			else {
				message = JSON.stringify(error);
			}
			this.logger.warn(`Unable to send codemark-based email notification to ${user.email}: ${message}`);
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
		const { post } = this.postData;
		const op = { 
			$set: {
				[`lastEmailsSent.${this.stream.id}`]: post.seqNum
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
