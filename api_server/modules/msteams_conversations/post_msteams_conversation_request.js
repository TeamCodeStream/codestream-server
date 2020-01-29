// handle the "POST /msteams_conversations" request to initiate a proactive message to an MS Teams bot

'use strict';

const PostRequest = require(process.env.CS_API_TOP + '/lib/util/restful/post_request');
const { BotFrameworkAdapter, CardFactory,
	TurnContext,
	MessageFactory,
	TeamsInfo,
	TeamsActivityHandler,
	ActionTypes } = require('botbuilder');
const { MicrosoftAppCredentials } = require('botframework-connector');
const MSTeamsConversationIndexes = require(process.env.CS_API_TOP + '/modules/msteams_conversations/indexes');
const MSTeamsConfig = require(process.env.CS_API_TOP + '/config/msteams');

class PostMSTeamsConversationRequest extends PostRequest {
	// authorize the request for the current user
	async authorize () {
		this.codemarkId = decodeURIComponent(this.request.body.codemarkId || '')
		if (!this.codemarkId) {
			throw this.errorHandler.error('parameterRequired', { info: 'codemarkId' });
		}

		this.channelId = decodeURIComponent(this.request.body.channelId || '');
		if (!this.channelId) {
			throw this.errorHandler.error('parameterRequired', { info: 'channelId' });
		}

		this.teamId = decodeURIComponent(this.request.body.teamId || '').toLowerCase();
		if (!this.teamId) {
			throw this.errorHandler.error('parameterRequired', { info: 'teamId' });
		}		
		const authorized = await this.user.authorizeTeam(this.teamId, this);
		if (!authorized) {
			throw this.errorHandler.error('createAuth', { reason: 'user not on team' });
		}
	}

	createCodemarkHeroCard (codemark) {
		return [CardFactory.heroCard('Codemark', codemark.get('text'), null, // No images
			[
				{
					type: 'invoke',
					title: 'View Discussion & Reply',
					value: {
						type: 'task/fetch',
						data: { codemark: codemark.attributes }
					}
				},
				{
					type: ActionTypes.OpenUrl,
					title: 'Open in IDE',
					value: 'https://docs.microsoft.com/en-us/azure/bot-service/?view=azure-bot-service-4.0'
				},
				{
					type: ActionTypes.OpenUrl,
					title: 'Open on GitHub',
					value: 'https://docs.microsoft.com/en-us/azure/bot-service/?view=azure-bot-service-4.0'
				}
			])];
		// let attachments = [];
		// const main = CardFactory.adaptiveCard()
		// // hero
		// const marker = {
		// 	contentType: "application/vnd.microsoft.card.hero",
		// 	id: "whatever",
		// 	subtitle: "fileName",
		// 	text: "<code>fooooooo</code>",
		// 	buttons: [{
		// 		type: "openUrl",
		// 		title: "Open on Foo",
		// 		value: "https://aol.com"
		// 	}]
		// }
		// const wrapper = CardFactory.adaptiveCard(marker);
		// attachments.push(wrapper);
		// return attachments;
	}

	async process () {
		const adapter = new BotFrameworkAdapter({
			appId: MSTeamsConfig.appClientId,
			appPassword: MSTeamsConfig.appClientSecret
		});
		const conversations = await this.data.msteams_conversations.getByQuery({
			conversationId: this.channelId
		}, {
			hint: MSTeamsConversationIndexes.byConversationIds
		});

		if (!conversations || !conversations.length) {
			this.warn(`No conversations found for conversationId=${this.channelId}`);
			return;
		}
		if (conversations.length != 1) {
			this.warn(`There are ${conversations.length} conversations found for counversationId=${this.channelId}`);
		}

		const conversationWrapper = conversations[0];
		const conversation = conversationWrapper.get('conversation');
		if (!conversation) {
			this.warn(`There is no conversation object found for counversationId=${this.channelId}`);
			return;
		}
		const codemark = await this.data.codemarks.getById(this.request.body.codemarkId);
		if (!codemark) {
			this.warn(`No codemark for counversationId=${this.channelId}`);
			return;
		}
		const attachments = this.createCodemarkHeroCard(codemark);

		// By default, the BotBuilder SDK adds a serviceUrl to the list of trusted host names 
		// if the incoming request is authenticated by BotAuthentication. 
		// They are maintained in an in-memory cache. 
		// If your bot is restarted, a user awaiting a proactive message cannot receive it 
		// unless they have messaged the bot again after it restarted.
		// see: https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-howto-proactive-message?view=azure-bot-service-4.0&tabs=javascript#avoiding-401-unauthorized-errors
		MicrosoftAppCredentials.trustServiceUrl(conversation.serviceUrl);

		// we send a "proactive" message by calling the continueConversation function
		// passing in the stored conversation reference.
		await adapter.continueConversation(conversation, async turnContext => {
			await turnContext.sendActivity({
				attachments: attachments
			});
		});
	}
}

module.exports = PostMSTeamsConversationRequest;
