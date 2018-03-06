// This file provides a simple interface to the slack bot, for posts going out and coming in

'use strict';

const HTTPSBot = require(process.env.CS_API_TOP + '/server_utils/https_bot');

class SlackBotClient {

	constructor (config = {}) {
		this.config = config;
	}

	// returns true to indicate this api service is actually an integration
	isIntegration () {
		return true;
	}

	// whether this integration is enabled for the given info structure
	isEnabled (info) {
		// slack integrations are enabled on a per-team basis
		const teamIntegrations = info.team && info.team.get('integrations');
		return (
			teamIntegrations &&
			teamIntegrations.slack &&
			teamIntegrations.slack.enabled
		);
	}

	// called when there is a new post
	postHook (info, callback, options = {}) {
		// package the message for slack-bot digestion and sent it over the wire
		let message = this.packageMessage(info);
		this.sendMessage(message, info, callback, options);
	}

	// package an info structure for a new post for slack-bot digestion
	packageMessage (info) {
		let message = {
			teamId: info.post.get('teamId'),
			repoId: info.repo.id,
			repoUrl: 'https://' + info.repo.get('normalizedUrl'),
			streamId: info.stream.id,
			file: info.stream.get('file')
		};
		this.addMentionedUsers(info, message);
		let postInfo = this.packagePost(info.post, info.creator, info);
		Object.assign(message, postInfo);
		return message;
	}

	// package post info, along with post creator info, for slack-bot digestion
	packagePost (post, creator, info) {
		let message = {
			postId: post.id,
			text: post.get('text'),
			creatorId: post.get('creatorId'),
			createdAt: post.get('createdAt'),
			creatorUsername: creator.get('username'),
			creatorFirstName: creator.get('firstName'),
			creatorLastName: creator.get('lastName'),
			creatorEmail: creator.get('email')
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

	// add any code blocks in the post to the outgoing message
	addCodeBlocks (post, message) {
		const codeBlocks = post.get('codeBlocks');
		if (!codeBlocks) { return; }
		message.codeBlocks = [];
		codeBlocks.forEach(codeBlock => {
			message.codeBlocks.push({
				code: codeBlock.code,
				preContext: codeBlock.preContext,
				postContext: codeBlock.postContext
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

	// send a formatted message to the slack-bot
	sendMessage (message, info, callback, options = {}) {
		if (this.requestSaysToTestSlackOut(options)) {
			// we received a header in the request asking us to divert this message
			// instead of actually sending it, for testing purposes ... we'll
			// emit the request body to the callback provided
			if (options.request) {
				options.request.log(`Diverting slack-bot message for post ${message.postId} to test callback`);
			}
			this.testCallback(message, info.team, options.request);
			return process.nextTick(callback);
		}
		else if (this.requestSaysToBlockSlackOut(options)) {
			// we received a header in the request asking us not to send out slack-bot
			// messages, for testing purposes
			if (options.request) {
				options.request.log(`Would have sent slack-bot message for post ${message.postId}`);
			}
			return process.nextTick(callback);
		}
		HTTPSBot.post(
			this.config.host,
			this.config.port,
			'/codestream/receive',
			message,
			callback,
			{
				// FIXME ... slack integration needs to use proper certificate
				rejectUnauthorized: false
			}
		);
	}

	// determine if special header was sent with the request that says to test slack output,
	// meaning we'll not actually send a message out but send it through a pubnub channel
	// to verify content instead
	requestSaysToTestSlackOut (options) {
		return (
			options.request &&
			options.request.request &&
			options.request.request.headers &&
			options.request.request.headers['x-cs-test-slack-out']
		);
	}

	// when testing slack-bot messages, we'll get the message that would otherwise be sent to
	// the slack-bot through this callback, we'll send it along through the team channel for
	// the team that owns the stream, which the test client should be listening to
	testCallback (message, team, request) {
		if (!team || !request.api.services.messager) { return; }
		let channel = `team-${team.id}`;
		let requestCopy = Object.assign({}, request);	// override test setting indicating not to send pubnub messages
		requestCopy.headers = Object.assign({}, request.headers);
		delete requestCopy.headers['x-cs-block-message-sends'];
		request.api.services.messager.publish(
			message,
			channel,
			() => {},
			request
		);
	}

	// determine if special header was sent with the request that says to block slack-bot messages
	requestSaysToBlockSlackOut (options) {
		return (
			options.request &&
			options.request.request &&
			options.request.request.headers &&
			options.request.request.headers['x-cs-block-slack-out']
		);
	}


}

module.exports = SlackBotClient;
