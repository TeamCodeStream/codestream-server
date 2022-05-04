'use strict';

const crypto = require('crypto');
const SlackUserHelper = require('./slack_user_helper');
const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request');
const PostCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/posts/post_creator');
const PostDeleter = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/posts/post_deleter');
const PostUpdater = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/posts/post_updater');
const PostPublisher = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/posts/post_publisher');
const PostIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/posts/indexes');

class SlackEventsRequest extends RestfulRequest {

	async authorize () {
		if (!this.verifySlackRequest(this.request)) {
			this.log('Slack verification failed');
			throw this.errorHandler.error('notFound');
		}
	}
	
	async process () {
		if (this.request.body.type === 'url_verification') {
			this.responseData = {
				challenge: this.request.body.challenge
			};
		}
	}

	// we send a 200 OK response regardless, so we want to send that before we do any work
	async postProcess () {
		if (this.request.body.type === 'url_verification') {
			return;
		}
		this.log(`Received slack event ${this.request.body.event_id}`);
		this.slackEvent = this.request.body.event;
		if (!this.slackEvent || this.slackEvent.type !== 'message') {
			return;
		}
		if (this.slackEvent.subtype === 'message_deleted') {
			await this.processMessageDeleted();
		}
		if (this.slackEvent.subtype === 'message_changed') {
			await this.processMessageChanged();
		}
		if (this.slackEvent.subtype === 'message_replied') {
			await this.processMessageReplied();
		}
		if (this.slackEvent.subtype === undefined) {
			await this.processMessageCreated();
		}
	}

	async cleanup () {
		if (this.cleanupTask) {
			await this.cleanupTask();
		}
	}

	verifySlackRequest (request) {
		// mainly snagged from https://medium.com/@rajat_sriv/verifying-requests-from-slack-using-node-js-69a8b771b704
		try {
			// see BodyParserModule.slackVerify() for where this comes from
			const rawBody = request.slackRawBody;
			if (!request.body || !rawBody) return false;

			const apiAppId = request.body.api_app_id;
			if (!apiAppId) return false;

			const slackSigningSecret = this.api.config.integrations.slack.signingSecretsByAppIds[apiAppId];
			if (!slackSigningSecret) {
				this.api.log(`Could not find signingSecret for appId=${apiAppId}`);
				return false;
			}

			const slackSignature = request.headers['x-slack-signature'];
			const timestamp = request.headers['x-slack-request-timestamp'];
			if (!slackSignature || !timestamp) return false;

			// protect against replay attacks
			const time = Math.floor(new Date().getTime() / 1000);
			if (Math.abs(time - timestamp) > 300) return false;

			const mySignature = 'v0=' +
				crypto.createHmac('sha256', slackSigningSecret)
					.update('v0:' + timestamp + ':' + rawBody, 'utf8')
					.digest('hex');

			return crypto.timingSafeEqual(
				Buffer.from(mySignature, 'utf8'),
				Buffer.from(slackSignature, 'utf8'));
		} catch (ex) {
			this.api.log(`verifySlackRequest error. ${ex}`);
		}
		return false;
	}

	async processMessageDeleted () {
		const message = this.slackEvent.previous_message;
		if (!this.isThreadedReply(message || {})) {
			return;
		}
		const post = await this.getPost(message.team, this.slackEvent.channel, message.ts);
		if (!post) {
			return;
		}
		this.postDeleter = new PostDeleter({
			request: this
		});
		try {
			await this.postDeleter.deleteModel(post.id);
			this.log('Deleted post via Slack event');
			// TODO: send broadcast messages properly for delete events
			this.cleanupTask = async () => { await this.postCreator.postProcess(); };
		} catch (ex) {
			this.log(`Error deleting post via Slack event: ${ex.message}`);
		}
	}

	async processMessageChanged () {
		const message = this.slackEvent.message;
		if (!this.isThreadedReply(message || {})) {
			return;
		}
		const post = await this.getPost(message.team, this.slackEvent.channel, message.ts);
		if (!post) {
			return;
		}
		this.user = this.data.users.getById(post.creatorId);
		const updater = new PostUpdater({
			request: this
		});
		try {
			const updateOp = await updater.updateModel(post.id, {
				text: message.text
			});
			this.log('Updated post via Slack event');
			this.cleanupTask = async () => {
				await new PostPublisher({
					data: {
						posts: updateOp
					},
					request: this,
					broadcaster: this.api.services.broadcaster,
					teamId: post.get('teamId')
				}).publishPost();
			};
		} catch (ex) {
			this.log(`Error updating post via Slack event: ${ex.message}`);
		}
	}

	async processMessageReplied () {
		if (!this.isThreadedReply(this.slackEvent.message || {})) {
			return;
		}
		// TODO: handle theoretical message_replied events
	}

	async processMessageCreated () {
		if (!this.isThreadedReply(this.slackEvent)) {
			return;
		}
		const existingPost = await this.getPost(this.slackEvent.team, this.slackEvent.channel, this.slackEvent.ts);
		if (existingPost) {
			return;
		}
		const parentPost = await this.getPost(this.slackEvent.team, this.slackEvent.channel, this.slackEvent.thread_ts);
		if (!parentPost) {
			return;
		}
		const botToken = await this.getBotToken(parentPost.get('teamId'), this.slackEvent.team);
		if (!botToken) {
			return;
		}
		const userHelper = new SlackUserHelper({
			request: this,
			accessToken: botToken
		});
		this.user =
			await userHelper.getUser(this.slackEvent.user, parentPost.get('teamId'))
			|| await userHelper.getFauxUser(parentPost.get('teamId'), this.slackEvent.team, this.slackEvent.user)
			|| await userHelper.createFauxUser(parentPost.get('teamId'), this.slackEvent.team, this.slackEvent.user);
		if (!this.user) {
			this.log('Could not find or create user based on Slack user');
			return;
		}
		const permalink = await userHelper.getPermalink(this.slackEvent.channel, this.slackEvent.ts);
		this.postCreator = new PostCreator({
			request: this,
			origin: 'Slack',
			setCreatedAt: Math.floor(this.slackEvent.ts * 1000),
			forSlack: true
		});
		const sharedTo = [{
			providerId: 'slack*com',
			teamId: parentPost.get('sharedTo')[0].teamId,
			teamName: parentPost.get('sharedTo')[0].teamName,
			channelId: parentPost.get('sharedTo')[0].channelId,
			channelName: parentPost.get('sharedTo')[0].channelName,
			postId: this.slackEvent.ts,
			url: permalink || ''
		}];
		const textAndMentions = await userHelper.processText(this.slackEvent.text);
		try {
			// TODO: set post creation date to time of slack post
			const postOp = await this.postCreator.createPost({
				text: textAndMentions.text,
				parentPostId: parentPost.id,
				teamId: parentPost.get('teamId'),
				streamId: parentPost.get('streamId'),
				sharedTo
			});
			const responseData = this.postCreator.makeResponseData({
				transforms: this.postCreator.transforms,
				initialResponseData: postOp.getSanitizedObject({ request: this })
			});
			this.log('Created post via Slack event');
			this.cleanupTask = async () => {
				await this.postCreator.postCreate({
					postPublishData: {
						posts: responseData
					}
				});
			};
		} catch (ex) {
			this.log(`Error creating post via Slack event: ${ex.message}`);
		}
	}

	isThreadedReply (message) {
		return message.thread_ts && message.thread_ts !== message.ts;
	}

	async getBotToken (teamId, slackTeamId) {
		const team = await this.data.teams.getById(teamId);
		if (!team) {
			return undefined;
		}
		const providerInfo = team.get('serverProviderInfo');
		return (
			providerInfo &&
			providerInfo.slack &&
			providerInfo.slack.multiple &&
			providerInfo.slack.multiple[slackTeamId] &&
			providerInfo.slack.multiple[slackTeamId].accessToken
		);
	}

	async getPost (teamId, channel, ts) {
		// TODO: set up indexes and posts field for querying this more efficiently
		const posts = await this.data.posts.getByQuery(
			{
				'sharedTo.0.providerId': 'slack*com',
				'sharedTo.0.teamId': teamId,
				'sharedTo.0.channelId': channel,
				'sharedTo.0.postId': ts
			},
			{
				hint: PostIndexes.byTeamId
			}
		);
		if (posts.length > 0) {
			return posts[0]; // there should only ever be one
		}
	}
}

module.exports = SlackEventsRequest;
