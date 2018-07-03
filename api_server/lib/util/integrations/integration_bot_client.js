// This file provides a simple interface to the integration bot for a given integration,
// for posts going out and coming in

'use strict';

const HTTPSBot = require(process.env.CS_API_TOP + '/server_utils/https_bot');
const { URL } = require('url');
const AwaitUtils = require(process.env.CS_API_TOP + '/server_utils/await_utils');

class IntegrationBotClient {

	constructor (config = {}) {
		this.config = config;
		['integrationName', 'secret', 'botOrigin', 'botReceivePath'].forEach(configOption => {
			if (!this.config[configOption]) {
				throw `must provide ${configOption} to the integration bot client`;
			}
		});
	}

	// returns true to indicate this api service is actually an integration
	isIntegration () {
		return true;
	}

	// whether this integration is enabled for the given info structure
	isEnabled (info) {
		// integrations are enabled on a per-team basis
		const teamIntegrations = info.team && info.team.get('integrations');
		return (
			teamIntegrations &&
			teamIntegrations[this.config.integrationName] &&
			teamIntegrations[this.config.integrationName].enabled
		);
	}

	// called when there is a new post
	async postHook (info, options = {}) {
		// don't send integration messages for private streams
		// (direct messages or private channels)
		if (info.stream.get('privacy') === 'private') {
			return;
		}
		// package the message for bot digestion and sent it over the wire
		const message = this.packageMessage(info);
		await this.sendMessage(message, info, options);
	}

	// package an info structure for a new post for bot digestion
	packageMessage (info) {
		let message = {
			teamId: info.post.get('teamId'),
			streamId: info.stream.id,
			file: info.stream.get('file')
		};
		if (info.repo) {
			message.repoId = info.repo.id;
			message.repoUrl = 'https://' + info.repo.get('normalizedUrl');
		}
		this.addMentionedUsers(info, message);
		let postInfo = this.packagePost(info.post, info.creator, info);
		Object.assign(message, postInfo);
		return message;
	}

	// package post info, along with post creator info, for bot digestion
	packagePost (post, creator, info) {
		let message = {
			secret: this.config.secret,
			postId: post.id,
			text: post.get('text'),
			creatorId: post.get('creatorId'),
			createdAt: post.get('createdAt'),
			creatorUsername: creator.get('username'),
			creatorFullName: creator.get('fullName'),
			creatorEmail: creator.get('email'),
			stream: info ? this.getStreamName(info) : null
		};
		if (post.get('commitHashWhenPosted')) {
			message.commitHashWhenPosted = post.get('commitHashWhenPosted');
		}
		if (post.get('mentionedUserIds')) {
			message.mentionedUserIds = post.get('mentionedUserIds');
		}
		if (info && info.parentPost) {
			message.parentPost = this.packagePost(info.parentPost, info.parentPostCreator, null);
		}
		this.addCodeBlocks(post, message);
		return message;
	}

	// get the name of the stream, which depends on its type
	getStreamName (info) {
		const type = info.stream.get('type');
		if (type === 'file') {
			return `https://${info.repo.get('normalizedUrl')}/${info.stream.get('file')}`;
		}
		else if (type === 'channel') {
			return info.stream.get('name');
		}
		else if (type === 'direct') {
			return ''; // for now
		}
	}

	// add any code blocks in the post to the outgoing message
	addCodeBlocks (post, message) {
		const codeBlocks = post.get('codeBlocks');
		if (!codeBlocks) { return; }
		message.codeBlocks = [];
		codeBlocks.forEach(codeBlock => {
			message.codeBlocks.push({
				code: codeBlock.code,
				preContext: codeBlock.preContext,
				postContext: codeBlock.postContext,
				file: codeBlock.file,
				repo: codeBlock.repo
			});
		});
	}

	// add any mentioned users (by username) in the post or parent post to the outgoing message
	addMentionedUsers (info, message) {
		if (info.mentionedUsers) {
			message.mentionedUsers = info.mentionedUsers;
		}
		if (info.mentionedUsersForParentPost && message.parentPost) {
			message.parentPost.mentionedUsers = info.mentionedUsersForParentPost;
		}
	}

	// send a formatted message to the bot
	async sendMessage (message, info, options = {}) {
		if (this.requestSaysToTestBotOut(options)) {
			// we received a header in the request asking us to divert this message
			// instead of actually sending it, for testing purposes ... we'll
			// emit the request body to the callback provided
			if (options.request) {
				options.request.log(`Diverting ${this.config.integrationName} bot message for post ${message.postId} to test callback`);
			}
			this.testCallback(message, info.team, options.request);
			return;
		}
		else if (this.requestSaysToBlockBotOut(options)) {
			// we received a header in the request asking us not to send out bot
			// messages, for testing purposes
			if (options.request) {
				options.request.log(`Would have sent ${this.config.integrationName} bot message for post ${message.postId}`);
			}
			return;
		}

		const url = new URL(this.config.botOrigin);
		await AwaitUtils.callbackWrap(
			HTTPSBot.post,
			url.hostname,
			url.port,
			this.config.botReceivePath,
			message,
			{
				rejectUnauthorized: false,
				useHttp: true
			}
		);
	}

	// determine if special header was sent with the request that says to test bot output,
	// meaning we'll not actually send a message out but send it through a pubnub channel
	// to verify content instead
	requestSaysToTestBotOut (options) {
		return (
			options.request &&
			options.request.request &&
			options.request.request.headers &&
			options.request.request.headers['x-cs-test-bot-out']
		);
	}

	// when testing bot messages, we'll get the message that would otherwise be sent to
	// the bot through this callback, we'll send it along through the team channel for
	// the team that owns the stream, which the test client should be listening to
	async testCallback (message, team, request) {
		if (!team || !request.api.services.messager) { return; }
		const channel = `team-${team.id}`;
		let requestCopy = Object.assign({}, request);	// override test setting indicating not to send pubnub messages
		requestCopy.headers = Object.assign({}, request.headers);
		delete requestCopy.headers['x-cs-block-message-sends'];
		await request.api.services.messager.publish(
			message,
			channel,
			request
		);
	}

	// determine if special header was sent with the request that says to block bot messages
	requestSaysToBlockBotOut (options) {
		return (
			options.request &&
			options.request.request &&
			options.request.request.headers &&
			options.request.request.headers['x-cs-block-bot-out']
		);
	}


}

module.exports = IntegrationBotClient;
