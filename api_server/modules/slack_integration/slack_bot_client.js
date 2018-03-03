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
	postHook (info, callback) {
		// package the message for slack-bot digestion and sent it over the wire
		let message = this.packageMessage(info);
		this.sendMessage(message, callback);
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
		this.addMentionedUsers();
		let postInfo = this.packagePost(info.post, info.creator);
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
		this.addCodeBlocks(message);
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
	sendMessage (message, callback) {
		HTTPSBot.post(
			this.config.host,
			this.config.port,
			'/codestream/receive',
			message,
			callback,
			{
				// FIXME ... slack integration needs to use proper certificate
				rejectUnauthorized: false,
				noJson: true
			}
		);
	}
}

module.exports = SlackBotClient;
