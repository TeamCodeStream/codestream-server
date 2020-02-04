// handle the "POST /msteams_conversations" request to initiate a proactive message to an MS Teams bot

'use strict';

const PostRequest = require(process.env.CS_API_TOP + '/lib/util/restful/post_request');
const { BotFrameworkAdapter, CardFactory, ActionTypes } = require('botbuilder');
const ProviderDisplayNames = require(process.env.CS_API_TOP + '/modules/web/provider_display_names');
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

	async createCodemarkHeroCard (codemark) {
		// return [CardFactory.heroCard('Codemark', codemark.get('text'), null, // No images
		// 	[
		// 		// {
		// 		// 	type: 'invoke',
		// 		// 	title: 'View Discussion & Reply',
		// 		// 	value: {
		// 		// 		type: 'task/fetch',
		// 		// 		data: { codemark: codemark.attributes }
		// 		// 	}
		// 		// },
		// 		{
		// 			type: ActionTypes.OpenUrl,
		// 			title: 'Open in IDE',
		// 			value: 'https://docs.microsoft.com/en-us/azure/bot-service/?view=azure-bot-service-4.0'
		// 		},
		// 		{
		// 			type: ActionTypes.OpenUrl,
		// 			title: 'Open on GitHub',
		// 			value: 'https://docs.microsoft.com/en-us/azure/bot-service/?view=azure-bot-service-4.0'
		// 		}
		// 	])];

		let attachments = [];
		let repos;
		let reposById;
		let markerIds = codemark.get('markerIds');
		let markers;
		let assigneeIds = codemark.get('assignees');
		let assignees;
		if (assigneeIds && assigneeIds.length) {
			assignees = await this.data.users.getByIds(assigneeIds);
			if (assignees && assignees.length) {
				assignees = assignees.map(_ => {
					return _.get('fullName');
				})
			}
		}
		if (markerIds && markerIds.length) {
			markerId = markerIds[0];
			markers = await this.data.markers.getByIds(markerIds);
			repos = await this.data.repos.getByIds(markers.map(_ => _.get('repoId')));
			reposById = repos.reduce(function (map, repo) {
				map[repo.id] = repo.attributes;
				return map;
			}, {});
		}

		for (const marker of markers) {
			let buttons = [];
			if (codemark.get('permalink')) {
				const url = `${codemark.get('permalink')}?ide=default&markerId=${marker.id}`;
				buttons.push({
					type: ActionTypes.OpenUrl,
					title: 'Open in IDE',
					value: url
				});
			}
			const remoteCodeUrl = marker.get('remoteCodeUrl') || this.codemark.get('remoteCodeUrl');
			if (remoteCodeUrl) {
				const codeProvider = ProviderDisplayNames[remoteCodeUrl.name] || remoteCodeUrl.name;
				const codeProviderUrl = remoteCodeUrl.url;
				buttons.push({
					type: ActionTypes.OpenUrl,
					title: `Open on ${codeProvider}`,
					value: codeProviderUrl
				});
			}

			const locationWhenCreated = marker.get('locationWhenCreated');
			let codeStartingLineNumber;
			let codeEndingLineNumber;
			if (locationWhenCreated && locationWhenCreated.length) {
				codeStartingLineNumber = locationWhenCreated[0];
				codeEndingLineNumber = locationWhenCreated[2];
			}
			else {
				const referenceLocations = marker.get('referenceLocations');
				if (referenceLocations && referenceLocations.length) {
					const location = referenceLocations[0].location;
					if (location) {
						codeStartingLineNumber = location[0];
						codeEndingLineNumber = location[2];
					}
				}
			}

			let line = codeStartingLineNumber && codeEndingLineNumber &&
				codeStartingLineNumber === codeEndingLineNumber ? `(Line ${codeStartingLineNumber})` :
				`(Lines ${codeStartingLineNumber}-${codeEndingLineNumber})`;

			let titleAndOrText;
			if (codemark.get('type') === 'issue') {
				titleAndOrText = `<b>${codemark.get('title')}</b>`;
				if (codemark.get('text')) {
					titleAndOrText += '<br>' + codemark.get('text');
				}
			}
			else {
				titleAndOrText = `${codemark.get('text')}`;
			}

			let assigneesOrEmpty = '';
			if (assignees) {
				assigneesOrEmpty = `Assignees: ${assignees.join(', ')}<br><br>`;
			}

			if (codemark.get('externalProviderUrl')) {
				buttons.push({
					type: ActionTypes.OpenUrl,
					title: `Open on ${ProviderDisplayNames[codemark.get('externalProvider')]}`,
					value: codemark.get('externalProviderUrl')
				});
			}

			const repoName = (reposById[marker.get('repoId')] || {}).name;
			const card = CardFactory.heroCard('',
				`${titleAndOrText}<br><br>
				${assigneesOrEmpty}
				[${repoName}] ${marker.get('file')} ${line}<br><br>
				<code>
				${this.whiteSpaceToHtml(marker.get('code'))}
				</code>`,
				null,
				buttons
			);
			attachments.push(card);
		}
		//	<br><small>Posted via CodeStream</small>
		return attachments;
	}

	whiteSpaceToHtml (text) {
		return text
			.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
			.replace(/^ +/gm, match => {
				return match.replace(/ /g, '&nbsp;');
			})
			.replace(/\n/g, '<br/>');
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
		const attachments = await this.createCodemarkHeroCard(codemark);

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
				attachments: attachments,
				attachmentLayout: 'carousel'
			});
		});
	}
}

module.exports = PostMSTeamsConversationRequest;
