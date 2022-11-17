'use strict';

const crypto = require('crypto');
const Markdown = require('markdown-it');
const MarkdownSlack = require('markdown-it-slack');
const SlackUserHelper = require('./slack_user_helper');
const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request');
const PostCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/posts/post_creator');
const PostDeleter = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/posts/post_deleter');
const PostUpdater = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/posts/post_updater');
const PostPublisher = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/posts/post_publisher');
const PostIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/posts/indexes');

const fileExtensions = require('./file_extensions');

const REMOTE_PROVIDERS = [
	{
		name: 'GitHub',
		regex: /github.com/i
	},
	{
		name: 'GitLab',
		regex: /gitlab.com/i
	},
	{
		name: 'Bitbucket',
		regex: /bitbucket.org/i
	},
	{
		name: 'Azure DevOps',
		regex: /dev.azure.com/i
	},
	{
		name: 'Azure DevOps',
		regex: /visualstudio.com/i
	}
];

class SlackEventsRequest extends RestfulRequest {

	async authorize () {
		if (!this.verifySlackRequest(this.request)) {
			this.warn('Slack verification failed');
			throw this.errorHandler.error('invalidParameter');
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
		// don't repost messages that originated from codestream
		if (this.slackEvent.app_id && this.slackEvent.app_id === this.api.config.integrations.slack.appId) {
			return;
		}
		if (!this.slackEvent.team) {
			this.slackEvent.team = this.request.body.team_id;
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
		if (this.slackEvent.subtype === undefined || this.slackEvent.subtype === 'file_share') {
			await this.processMessageCreated();
		}
	}

	async cleanup () {
		if (this.cleanupTask) {
			await this.cleanupTask();
		}
	}

	verifySlackRequest (request) {
		try {
			// see BodyParserModule.slackVerify() for where this comes from
			const rawBody = request.slackRawBody;
			if (!request.body || !rawBody) {
				this.api.warn('Missing body for Slack verification');
				return false;
			}

			const slackSigningSecret = this.api.config.integrations.slack.appSigningSecret;
			if (!slackSigningSecret) {
				this.api.warn('Could not find signingSecret');
				return false;
			}

			const slackSignature = request.headers['x-slack-signature'];
			const timestamp = request.headers['x-slack-request-timestamp'];
			if (!slackSignature || !timestamp) {
				this.api.warn('Missing required headers for Slack verification');
				return false;
			}

			// protect against replay attacks
			const time = Math.floor(new Date().getTime() / 1000);
			if (Math.abs(time - timestamp) > 300) {
				this.api.warn('Request expired, cannot verify');
				return false;
			}

			const mySignature = 'v0=' +
				crypto.createHmac('sha256', slackSigningSecret)
					.update('v0:' + timestamp + ':' + rawBody, 'utf8')
					.digest('hex');

			const signaturesMatch = crypto.timingSafeEqual(
				Buffer.from(mySignature, 'utf8'),
				Buffer.from(slackSignature, 'utf8'));

			if (!signaturesMatch) {
				this.api.warn('Signature does not match for slack verification');
			}
			return signaturesMatch;
		} catch (ex) {
			this.api.warn(`verifySlackRequest error. ${ex}`);
		}
		return false;
	}

	async processMessageDeleted () {
		const message = this.slackEvent.previous_message;
		if (!this.isThreadedReply(message || {})) {
			return;
		}
		const post = await this.getPost(message.team || this.slackEvent.team, this.slackEvent.channel, message.ts);
		if (!post) {
			return;
		}
		this.postDeleter = new PostDeleter({
			request: this
		});
		try {
			const deleteOp = await this.postDeleter.deleteModel(post.id);
			const responseData = {
				post: deleteOp
			};
			await this.postDeleter.handleResponse(responseData);
			this.log(`Deleted post ${post.id} via Slack event`);
			this.cleanupTask = async () => { await this.postDeleter.postProcess(responseData); };
		} catch (ex) {
			this.log(`Error deleting post via Slack event: ${ex.message}`);
		}
	}

	async processMessageChanged () {
		const message = this.slackEvent.message;
		if (!this.isThreadedReply(message || {})) {
			return;
		}
		const post = await this.getPost(message.team || message.user_team, this.slackEvent.channel, message.ts);
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
			this.log(`Updated post ${post.id} via Slack event`);
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
			await this.processEventForTelemetry();
			return;
		}
		const existingPost = await this.getPost(this.slackEvent.team, this.slackEvent.channel, this.slackEvent.ts);
		if (existingPost) {
			return;
		}
		const parentPost = await this.getPost(this.slackEvent.team, this.slackEvent.channel, this.slackEvent.thread_ts);
		if (!parentPost) {
			await this.processEventForTelemetry();
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
			this.warn('Could not find or create user based on Slack user');
			return;
		}
		const permalink = await userHelper.getPermalink(this.slackEvent.channel, this.slackEvent.ts);
		this.postCreator = new PostCreator({
			request: this,
			origin: 'Slack',
			setCreatedAt: Math.floor(this.slackEvent.ts * 1000),
			forSlack: true
		});
		const parentSharedTo = parentPost.get('sharedTo').find(_ => (
			_.providerId === 'slack*com' &&
			_.teamId === this.slackEvent.team &&
			_.channelId === this.slackEvent.channel &&
			_.postId === this.slackEvent.thread_ts
		));
		const sharedTo = [{
			providerId: 'slack*com',
			teamId: parentSharedTo.teamId,
			teamName: parentSharedTo.teamName,
			channelId: parentSharedTo.channelId,
			channelName: parentSharedTo.channelName,
			postId: this.slackEvent.ts,
			url: permalink || ''
		}];
		const textAndMentions = await userHelper.processText(this.slackEvent.text, parentPost.get('teamId'));
		let files;
		if (this.slackEvent.files) {
			files = this.slackEvent.files.map(f => ({
				name: f.name,
				mimetype: f.mimetype,
				size: f.size,
				url: f.permalink
			}));
		}
		try {
			const postOp = await this.postCreator.createPost({
				text: textAndMentions.text,
				parentPostId: parentPost.id,
				teamId: parentPost.get('teamId'),
				streamId: parentPost.get('streamId'),
				files,
				sharedTo
			});
			const responseData = this.postCreator.makeResponseData({
				transforms: this.postCreator.transforms,
				initialResponseData: postOp.getSanitizedObject({ request: this })
			});
			const team = await this.data.teams.getById(parentPost.get('teamId'));
			const company = await this.data.companies.getById(team.get('companyId'));
			this.sendTelemetry({
				event: 'Reply Created',
				team,
				company,
				parentPost
			});
			this.log(`Created post ${responseData.id} via Slack event`);
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

	async processEventForTelemetry () {
		const userHelper = new SlackUserHelper({
			request: this
		});
		this.slackUserConnected = await userHelper.isSlackUserConnected(this.slackEvent.user);
		
		await this.processCodeFences();
		await this.processFilenames();
		await this.processSha1();
		await this.processCodeHosts();
	}

	async processCodeFences () {
		const fences = this.findCodeFences(this.slackEvent.text);
		if (fences.length === 0) {
			return;
		}

		this.log('Code fence pasted in Slack');
		this.sendTelemetry({
			event: 'Code Pasted in Messaging Service',
			data: {
				'Connected to Slack': this.slackUserConnected
			},
			userId: this.slackEvent.user
		});
	}

	// find probable filenames in the message text and send a telemetry event
	async processFilenames () {
		// we just want a decent likelihood that there exists a filename somewhere
		// we filter out the most common urls and email addresses below
		const matches = this.slackEvent.text.matchAll(/\S+\.(\w+)/g);
		for (const match of matches) {
			if (!fileExtensions.includes(match[1]) || match[0].includes('http') || match[0].includes('@')) {
				continue;
			}

			this.log('Filename mentioned in Slack');
			this.sendTelemetry({
				event: 'Filename Mentioned in Messaging Service',
				data: {
					'Connected to Slack': this.slackUserConnected
				},
				userId: this.slackEvent.user
			});
			break;
		}
	}

	async processSha1 () {
		const match1 = this.slackEvent.text.match(/\b[a-f0-9]{7}\b/);
		const match2 = this.slackEvent.text.match(/\b[a-f0-9]{40}\b/);
		if (!match1 && !match2) {
			return;
		}

		this.log('Commit hash mentioned in Slack');
		this.sendTelemetry({
			event: 'Commit Hash Mentioned in Messaging Service',
			data: {
				'Connected to Slack': this.slackUserConnected,
				Type: match1 ? 'short' : 'long'
			},
			userId: this.slackEvent.user
		});
	}

	async processCodeHosts () {
		for (const codeHost of REMOTE_PROVIDERS) {
			if (this.slackEvent.text.match(codeHost.regex)) {
				this.log(`Code host ${codeHost.name} mentioned in Slack`);
				this.sendTelemetry({
					event: 'Code Host Mentioned in Messaging Service',
					data: {
						'Code Host': codeHost.name,
						'Connected to Slack': this.slackUserConnected
					},
					userId: this.slackEvent.user
				});
			}
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
		const providerInfo = team.get('serverProviderToken');
		return (
			providerInfo &&
			providerInfo.slack &&
			providerInfo.slack.multiple &&
			providerInfo.slack.multiple[slackTeamId]
		);
	}

	async getPost (teamId, channel, ts) {
		const shareIdentifier = [
			'slack',
			teamId,
			channel,
			ts
		].join('::');
		return await this.data.posts.getOneByQuery(
			{
				shareIdentifiers: shareIdentifier,
				deactivated: false
			},
			{
				hint: PostIndexes.byShareIdentifiers
			}
		);
	}

	async sendTelemetry (params) {
		const trackData = {
			Endpoint: 'Slack',
			...params.data
		};

		if (params.parentPost) {
			if (params.parentPost.get('reviewId')) {
				Object.assign(trackData, {
					'Parent ID': params.parentPost.get('reviewId'),
					'Parent Type': 'Review'
				});
			} else if (params.parentPost.get('codeErrorId')) {
				Object.assign(trackData, {
					'Parent ID': params.parentPost.get('codeErrorId'),
					'Parent Type': 'Error'
				});
			} else if (params.parentPost.get('codemarkId')) {
				Object.assign(trackData, {
					'Parent ID': params.parentPost.get('codemarkId'),
					'Parent Type': 'Codemark'
				});
			}
		}

		this.api.services.analytics.trackWithSuperProperties(
			params.event,
			trackData,
			{
				request: this,
				user: this.user,
				team: params.team,
				company: params.company,
				userId: !this.user && params.userId
			}
		);
	}

	findCodeFences (content) {
		if (!this.md) {
			this.md = Markdown();
			this.md.use(MarkdownSlack);
		}
		const tokens = this.md.parse(content, {});
		const fences = [];
		// slack formats markdown weird and markdown-it-slack only handles it for rendering, not parsing
		for (const token of tokens) {
			if (token.type === 'fence') {
				if (token.tag === 'code') {
					if (token.info) {
						token.content = `${token.info}\n${token.content}`;
					}
					const i = token.content && token.content.indexOf('```');
					if (i && i !== -1) {
						const [code, rest] = [token.content.slice(0, i), token.content.slice(i+3)];
						fences.push(code);
						fences.push(...this.findCodeFences(rest));
					}
				}
			}
			if (token.type === 'inline' && token.children) {
				for (const childToken of token.children) {
					if (childToken.type === 'code_inline' && childToken.tag === 'code') {
						fences.push(childToken.content);
					}
				}
			}
		}
		return fences;
	}
}

module.exports = SlackEventsRequest;
