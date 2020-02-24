// handle the "POST /msteams_conversations" request to initiate a 
// "proactive" message to an MS Teams bot
// see: https://docs.microsoft.com/en-us/graph/teams-proactive-messaging

/*eslint complexity: ["error", 666]*/

'use strict';

const PostRequest = require(process.env.CS_API_TOP + '/lib/util/restful/post_request');
const { CardFactory, ActionTypes } = require('botbuilder');
const ProviderDisplayNames = require(process.env.CS_API_TOP + '/modules/web/provider_display_names');
const { MicrosoftAppCredentials } = require('botframework-connector');
const MSTeamsConversationIndexes = require(process.env.CS_API_TOP + '/modules/msteams_conversations/indexes');
const MSTeamsBotFrameworkAdapter = require(process.env.CS_API_TOP + '/modules/providers/msteams_bot_framework_adapter');

class PostMSTeamsConversationRequest extends PostRequest {
	// authorize the request for the current user	
	async authorize () {
		this.codemarkId = decodeURIComponent(this.request.body.codemarkId || '');
		this.reviewId = decodeURIComponent(this.request.body.reviewId || '');
		if (!this.codemarkId && !this.reviewId) {
			throw this.errorHandler.error('parameterRequired', { info: 'codemarkId or reviewId' });
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

	async postProcess () {
		// since there's no creator class here (we're not actually creating antything via this POST [just triggering])...
		// override the base so we have a noop				
	}

	async createCodemarkHeroCard (codemark) {
		// This example shows how to create a "task" aka button for triggering a model for our replies

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
				});
			}
		}
		if (markerIds && markerIds.length) {
			markers = await this.data.markers.getByIds(markerIds);
			repos = await this.data.repos.getByIds(markers.map(_ => _.get('repoId')));
			reposById = repos.reduce(function (map, repo) {
				map[repo.id] = repo.attributes;
				return map;
			}, {});
		}
		const creator = await this.data.users.getById(codemark.get('creatorId'));
		let author;
		if (creator) {
			author = creator.get('fullName');
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
			const remoteCodeUrl = marker.get('remoteCodeUrl') || codemark.get('remoteCodeUrl');
			if (remoteCodeUrl) {
				const codeProvider = ProviderDisplayNames[remoteCodeUrl.name] || remoteCodeUrl.name;
				const codeProviderUrl = remoteCodeUrl.url;
				buttons.push({
					type: ActionTypes.OpenUrl,
					title: `Open on ${codeProvider}`,
					value: codeProviderUrl
				});
			}

			// make the line numbers
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

			let titleAndOrText = '';
			if (codemark.get('type') === 'issue') {
				if (author) {
					titleAndOrText += `<small><b>${author}</b> created an issue</small><br><br>`;
				}
				titleAndOrText += `<b>${codemark.get('title')}</b>`;
				if (codemark.get('text')) {
					titleAndOrText += '<br>' + codemark.get('text');
				}
			}
			else {
				if (author) {
					titleAndOrText += `<small><b>${author}</b> commented on code</small><br><br>`;
				}
				titleAndOrText += `${codemark.get('text')}`;
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

			// TODO: this is actually "small", but there's no where to put it after the buttons
			// <br><small>Posted via CodeStream</small>
			const repoName = (reposById[marker.get('repoId')] || {}).name;
			const card = CardFactory.heroCard('',
				`${titleAndOrText}<br><br>
				${assigneesOrEmpty}
				[${repoName}] ${marker.get('file')} ${line}<br><br>
				<code style="font-size:.9em;white-space:pre;display:block;overflow:auto;">${this.escapeHtml(marker.get('code'))}</code>`,
				null,
				buttons
			);
			attachments.push(card);
		}
		return attachments;
	}

	async createReviewHeroCard (review) {
		let repos;
		let reposById;
		const buttons = [];
		const modifiedFiles = [];
		const modifiedReposBranches = [];
		if (review.get('deactivated')) {
			return [CardFactory.heroCard('',
				'<i>This review has been deactivated</i>',
				null,
				null
			)];
		}

		const reviewChangesets = review.get('reviewChangesets');
		if (reviewChangesets && reviewChangesets.length) {
			repos = await this.data.repos.getByIds(reviewChangesets.map(_ => _.repoId));
			reposById = repos.reduce(function (map, repo) {
				map[repo.id] = repo.attributes;
				return map;
			}, {});

			for (const changeSet of reviewChangesets) {
				let file = 'files';
				if (changeSet.modifiedFiles) {
					for (const modifiedFile of changeSet.modifiedFiles) {
						const added = modifiedFile.linesAdded > 0 ? ` +${modifiedFile.linesAdded}` : '';
						const removed = modifiedFile.linesRemoved > 0 ? ` -${modifiedFile.linesRemoved}` : '';
						modifiedFiles.push(`${modifiedFile.file}${added}${removed}`);
					}
					if (changeSet.modifiedFiles.length === 1) {
						file = 'file';
					}
				}

				const repo = reposById[changeSet.repoId];
				let repoName = 'a repo';
				if (repo) {
					repoName = repo.name;
				}
				modifiedReposBranches.push(`${changeSet.modifiedFiles.length} ${file} on <b>${changeSet.branch}</b> from <b>${repoName}</b>`);
			}
		}
		const creator = await this.data.users.getById(review.get('creatorId'));
		let author;
		if (creator) {
			author = creator.get('fullName');
		}
		
		let permalink = review.get('permalink');
		if (permalink) {
			buttons.push({
				type: ActionTypes.OpenUrl,
				title: 'Open in IDE',
				value: `${permalink}?ide=default`
			});
		}

		let titleAndOrText = '';
		if (author) {
			titleAndOrText += `<small><b>${author}</b> wants a review of changes to ${modifiedReposBranches.join(', ')}</small><br><br>`;
		}
		titleAndOrText += `<b>${review.get('title')}</b>`;
		if (review.get('text')) {
			titleAndOrText += '<br>' + review.get('text');
		}

		let assigneesOrEmpty = '';
		let assigneeIds = review.get('reviewers');
		if (assigneeIds && assigneeIds.length) {
			const assignees = await this.data.users.getByIds(assigneeIds);
			if (assignees && assignees.length) {
				assigneesOrEmpty = `<b>Assignees</b><br>${assignees.map(_ => {
					return _.get('fullName');
				}).join(', ')}<br><br>`;
			}
		}

		// TODO: this is actually "small", but there's no where to put it after the buttons
		// <br><small>Posted via CodeStream</small>

		return [CardFactory.heroCard('',
			`${titleAndOrText}<br><br>
				${assigneesOrEmpty}				
				<code style="font-size:.9em;white-space:pre;display:block;overflow:auto;">${modifiedFiles.join('\n')}</code>`,
			null,
			buttons
		)];
	}

	escapeHtml (s) {
		return s
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#039;');
	}

	// unused, but might be required if we change how the text is later formatted
	whiteSpaceToHtml (text) {
		return text
			.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
			.replace(/^ +/gm, match => {
				return match.replace(/ /g, '&nbsp;');
			})
			.replace(/\n/g, '<br/>');
	}

	async process () {
		// we generically call channels what Microsoft refers to as conversations
		const conversations = await this.data.msteams_conversations.getByQuery({
			conversationId: this.channelId
		}, {
			hint: MSTeamsConversationIndexes.byConversationIds
		});

		if (!conversations || !conversations.length) {
			this.warn(`No conversations found for conversationId/channelId=${this.channelId}`);
			return;
		}
		if (conversations.length != 1) {
			this.warn(`There are ${conversations.length} conversations found for conversationId/channelId=${this.channelId}`);
		}

		const conversationWrapper = conversations[0];
		const conversation = conversationWrapper.get('conversation');
		if (!conversation) {
			this.warn(`There is no conversation object found for conversationId/channelId=${this.channelId}`);
			return;
		}
		let attachments = [];
		if (this.codemarkId) {
			const codemark = await this.data.codemarks.getById(this.codemarkId);
			if (!codemark) {
				this.warn(`No codemark for conversationId=${this.channelId} codemarkId=${this.codemarkId}`);
				return;
			}
			attachments = await this.createCodemarkHeroCard(codemark);
		}
		else if (this.reviewId) {
			const review = await this.data.reviews.getById(this.reviewId);
			if (!review) {
				this.warn(`No review for conversationId=${this.channelId} reviewId=${this.reviewId}`);
				return;
			}
			attachments = await this.createReviewHeroCard(review);
		}

		// By default, the BotBuilder SDK adds a serviceUrl to the list of trusted host names 
		// if the incoming request is authenticated by BotAuthentication. 
		// They are maintained in an in-memory cache. 
		// If your bot is restarted, a user awaiting a proactive message cannot receive it 
		// unless they have messaged the bot again after it restarted.
		// see: https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-howto-proactive-message?view=azure-bot-service-4.0&tabs=javascript#avoiding-401-unauthorized-errors
		MicrosoftAppCredentials.trustServiceUrl(conversation.serviceUrl);

		// we send a "proactive" message by calling the continueConversation function
		// passing in the stored conversation reference.
		await MSTeamsBotFrameworkAdapter.continueConversation(conversation, async turnContext => {
			await turnContext.sendActivity({
				attachments: attachments,
				attachmentLayout: 'carousel'
			});
		});
	}
}

module.exports = PostMSTeamsConversationRequest;
