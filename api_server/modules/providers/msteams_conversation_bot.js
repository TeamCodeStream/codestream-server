/*eslint complexity: ["error", 666]*/
const {
	TurnContext,
	MessageFactory,
	TeamsInfo,
	TeamsActivityHandler,
	CardFactory,
	ActionTypes
} = require('botbuilder');

const PERSONAL_BOT_MESSAGE = 'Please run this command from your personal bot chat.';
const TEAM_BOT_MESSAGE = 'Please run this command from a team channel.';

class MSTeamsConversationBot extends TeamsActivityHandler {
	constructor () {
		super();

		// TODO implement these?

		// this.onConversationUpdate(async (context, next) => {
		//     console.log(JSON.stringify(context.activity));
		//     await context.sendActivity("conversation update");
		//     await next();
		// });

		// https://docs.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/subscribe-to-conversation-events?tabs=typescript
		// this.onTeamsChannelDeletedEvent(async (channelInfo, teamInfo, context, next) => {
		//     const card = CardFactory.heroCard('Channel Deleted', `${channelInfo.name} is the Channel deleted`);
		//     const message = MessageFactory.attachment(card);
		//     await context.sendActivity(message);
		//     await next();
		// });
		// this.onTeamsChannelRenamedEvent(async (channelInfo, teamInfo, context, next) => {
		//     const card = CardFactory.heroCard('Channel Renamed', `${channelInfo.name} is the Channel renamed`);
		//     const message = MessageFactory.attachment(card);
		//     await context.sendActivity(message);
		//     await next();
		// });
		// this.onTeamsChannelCreatedEvent(async (channelInfo, teamInfo, context, next) => {
		//     const card = CardFactory.heroCard('Channel Created', `${channelInfo.name} is the Channel created`);
		//     const message = MessageFactory.attachment(card);
		//     await context.sendActivity(message);
		//     await next();
		// });
		// this.onTeamsTeamRenamedEvent(async (teamInfo, context, next) => {
		//     const card = CardFactory.heroCard('Team renamed', `${teamInfo.name} is the Team renamed`);
		//     const message = MessageFactory.attachment(card);
		//     await context.sendActivity(message);
		//     await next();
		// });
		// this.onTeamsMembersAddedEvent(async (membersAdded, teamInfo, context, next) => {
		//     const card = CardFactory.heroCard('members added qqqqq', `${JSON.stringify(membersAdded)}`);
		//     const message = MessageFactory.attachment(card);
		//     await context.sendActivity(message);
		//     await next();
		// });
		// this.onTeamsMembersRemovedEvent(async (membersRemoved, context, next) => {
		//     const card = CardFactory.heroCard('members removed', `${JSON.stringify(membersRemoved)}`);
		//     const message = MessageFactory.attachment(card);
		//     await context.sendActivity(message);
		//     await next();
		// });

		// this.onMembersAddedActivity(async (context, next) => {
		//     context.activity.membersAdded.forEach(async (teamMember) => {
		//         if (teamMember.id !== context.activity.recipient.id) {
		//             await context.sendActivity(`Welcome to the team ${teamMember.givenName} ${teamMember.surname}`);
		//         }
		//     });
		//     await next();
		// });

		this.onMessage(async (context, next) => {
			let teamDetails;
			let teamChannels;
			const channelData = context.activity.channelData;
			const team = channelData && channelData.team ? channelData.team : undefined;
			const teamId = team && typeof (team.id) === 'string' ? team.id : undefined;
			if (teamId) {
				teamDetails = await TeamsInfo.getTeamDetails(context);
				teamChannels = await TeamsInfo.getTeamChannels(context);
				// NOTE: "members" works without a teamId
				// members = await TeamsInfo.getMembers(context);
				// teamMembers = await TeamsInfo.getTeamMembers(context);
			}

			TurnContext.removeRecipientMention(context.activity);

			const text = context.activity.text.trim();
			// if this looks like a guid without hypens (aka a signup token...)
			if (text.match(/^[0-9a-f]{8}[0-9a-f]{4}[0-5][0-9a-f]{3}[089ab][0-9a-f]{3}[0-9a-f]{12}$/i)) {
				const result = await this.databaseAdapter.complete({
					tenantId: channelData.tenant.id,
					token: text
				});
				if (result) {
					// TODO this might work as a way to mention the bot and make it clickable
					// const mention = {
					//     mentioned: context.activity.from,
					//     text: `<at>${new TextEncoder().encode(context.activity.from.name)}</at>`,
					//     type: 'mention'
					// };
					// const replyActivity = MessageFactory.text(`Hi ${mention.text}`);
					// replyActivity.entities = [mention];
					// await context.sendActivity(replyActivity);
					await context.sendActivity('Ok, now one more step. Mention the CodeStream bot with the `connect` command in any team channel where you\'d like to use CodeStream.');
				}
				else {
					await context.sendActivity('Oops, we hit a snag trying to connect to CodeStream. Please try signing in again!');
				}
			}
			else {
				switch (text) {
				case 'Help':
				case 'help':
					await this.help(context);
					break;
				case 'EasterEgg':
				case 'easterEgg':
				case 'easteregg':
					await this.easterEgg(context);
					break;
				case 'disconnectall':
				case 'disconnect-all':
				case 'DisconnectAll':
					if (teamId) {
						await this.disconnectAll(context, context.activity, teamDetails, teamChannels, channelData.tenant.id);
					}
					break;
				case 'disconnect':
				case 'Disconnect':
					if (teamId) {
						await this.disconnect(context, context.activity, teamDetails, teamChannels, channelData.tenant.id);
					}
					else {
						await context.sendActivity(TEAM_BOT_MESSAGE);
					}
					break;
				case 'logout':
				case 'Logout':
				case 'signout':
				case 'Signout':
					if (teamId) {
						await context.sendActivity(PERSONAL_BOT_MESSAGE);
					}
					else {
						await this.signout(context);
					}
					break;
				case 'Login':
				case 'login':
				case 'Signin':
				case 'signin':
					if (teamId) {
						await context.sendActivity(PERSONAL_BOT_MESSAGE);
					}
					else {
						await this.signin(context);
					}
					break;
				case 'Signup':
				case 'signup':
					if (teamId) {
						await context.sendActivity(PERSONAL_BOT_MESSAGE);
					}
					else {
						await this.signup(context);
					}
					break;
				case 'connect':
				case 'Connect':
					if (teamId) {
						await this.connect(context, context.activity, teamDetails, teamChannels, channelData.tenant.id);
					}
					else {
						await context.sendActivity(TEAM_BOT_MESSAGE);
					}
					break;
				case 'Welcome':
				default:
					await context.sendActivity('I\'m not sure about that command, but thanks for checking out CodeStream. Type the `help` if you need anything.');
					break;
				}
			}
			await next();
		});
	}

	attachHandler (handler, options) {
		this.databaseAdapter = handler;
		Object.assign(this, options);
	}

	async process () {
		// this will be a way to capture any state for this request
		return await this.databaseAdapter.process();
	}

	async connect (context, activity, teamDetails, teamChannels, tenantId) {
		const conversationReference = TurnContext.getConversationReference(activity);

		const result = await this.databaseAdapter.connect({
			conversation: conversationReference,
			team: teamDetails,
			tenantId: tenantId,
			teamChannels: teamChannels
		});
		if (result) {
			await context.sendActivity('This channel is now ready to receive messages from CodeStream.');
		}
		else {
			await context.sendActivity(MessageFactory.text('Oops, we had a problem connecting CodeStream from this conversation. Please try again.'));
		}
		return result;
	}

	async disconnect (context, activity, teamDetails, teamChannels, tenantId) {
		const conversationReference = TurnContext.getConversationReference(activity);

		const result = await this.databaseAdapter.disconnect({
			conversation: conversationReference,
			team: teamDetails,
			tenantId: tenantId,
			teamChannels: teamChannels
		});

		if (result) {
			await context.sendActivity(MessageFactory.text('CodeStream has been disconnected from this channel.'));
		}
		else {
			await context.sendActivity(MessageFactory.text('Oops, we had a problem disconnecting CodeStream from this conversation. Please try again.'));
		}
		return result;
	}

	async disconnectAll (context, activity, teamDetails, teamChannels, tenantId) {
		const result = await this.databaseAdapter.disconnectAll({
			teamId: teamDetails.id,
			tenantId: tenantId
		});

		if (result) {
			await context.sendActivity(MessageFactory.text('CodeStream has been disconnected from all conversations.'));
		}
		else {
			await context.sendActivity(MessageFactory.text('Oops, we had a problem disconnecting CodeStream from all conversations. Please try again.'));
		}
		return result;
	}

	async signout (context) {
		const result = await this.databaseAdapter.signout({
			tenantId: context.activity.channelData.tenant.id
		});
		if (result) {
			await context.sendActivity(MessageFactory.text('You have been signed out of CodeStream.'));
		}
		else {
			await context.sendActivity(MessageFactory.text('Oops, we had a problem signing you out of CodeStream. Please try again.'));
		}
	}

	async easterEgg (context) {
		await context.sendActivity(MessageFactory.text('You\'re awesome!'));
	}

	async signin (context) {
		const result = await this.databaseAdapter.isTeamConnected({
			tenantId: context.activity.channelData.tenant.id
		});
		if (result === 'Already connected') {
			await context.sendActivity(MessageFactory.text('Your team is already connected to CodeStream!'));
		}
		else {
			// NOTE this can also work, but it's styling is a little chunky
			// const card = CardFactory.signinCard("Sign in", `${this.api.config.api.publicApiUrl}/web/login?tenantId=` + context.activity.channelData.tenant.id, "Sign in to CodeStream to get started!");

			const card = CardFactory.heroCard('', 'Sign in to CodeStream to get started!', null,
				[
					{
						type: ActionTypes.OpenUrl,
						title: 'Sign in',
						value: `${this.api.config.api.publicApiUrl}/web/login?tenantId=` + context.activity.channelData.tenant.id
					}
				]);

			await context.sendActivity({
				attachments: [card]
			});
			await context.sendActivity(MessageFactory.text('After signing in, please copy the code shown on your screen and paste it here.'));
		}
	}

	async signup (context) {
		const card = CardFactory.heroCard('', 'Download the CodeStream IDE extension to get started!', null,
			[
				{
					type: ActionTypes.OpenUrl,
					title: 'Sign up',
					value: 'https://www.codestream.com'
				}
			]);
		await context.sendActivity({
			attachments: [card]
		});
	}

	async help (context) {
		const card = CardFactory.heroCard('', 'CodeStream help is just a click away!', null,
			[
				{
					type: ActionTypes.OpenUrl,
					title: 'Help',
					value: 'https://github.com/TeamCodeStream/CodeStream/wiki/Participating-from-MS-Teams'
				}
			]);
		await context.sendActivity({
			attachments: [card]
		});
	}

	/* modal start */

	// handleTeamsTaskModuleFetch (context, taskModuleRequest) {
	//     // taskModuleRequest.data can be checked to determine different paths.

	//     return {
	//         task: {
	//             type: 'continue',
	//             value: {
	//                 card: this.getTaskModuleAdaptiveCard(taskModuleRequest),
	//                 //  height: 400,
	//                 // width: 600,
	//                 title: 'Post a Reply'
	//             }
	//         }
	//     };
	// }

	// async handleTeamsTaskModuleSubmit (context, taskModuleRequest) {
	//     // dataAdapater.handleSubmit(context);

	//     // Hello. You said: ' + taskModuleRequest.data.usertext
	//     return {
	//         task: {
	//             // This could also be of type 'continue' with a new Task Module and card.
	//             type: 'message',
	//             value: 'Reply posted to CodeSteam!'
	//         }
	//     };
	// }

	// getTaskModuleAdaptiveCard (taskModuleRequest) {
	//     const codemark = taskModuleRequest.data.data.codemark;
	//     return CardFactory.adaptiveCard({
	//         version: '1.0.0',
	//         type: 'AdaptiveCard',
	//         body: [
	//             {
	//                 "type": "Container",
	//                 "items": [
	//                     {
	//                         "type": "ColumnSet",
	//                         "columns": [
	//                             {
	//                                 "type": "Column",
	//                                 "width": "auto",
	//                                 "items": [
	//                                     {
	//                                         "size": "small",
	//                                         "style": "person",
	//                                         "type": "Image",
	//                                         "url": "https://www.gravatar.com/avatar/f7260737d0f0098738ec7e788ec4bfe5"
	//                                     }
	//                                 ]
	//                             },
	//                             {
	//                                 "type": "Column",
	//                                 "width": "stretch",
	//                                 "items": [
	//                                     {
	//                                         "type": "TextBlock",
	//                                         "text": "Matt Hidinger",
	//                                         "weight": "bolder",
	//                                         "wrap": true
	//                                     },
	//                                     {
	//                                         "type": "TextBlock",
	//                                         "spacing": "none",
	//                                         "text": "Created {{DATE(2017-02-14T06:08:39Z, SHORT)}}",
	//                                         "isSubtle": true,
	//                                         "wrap": true
	//                                     }
	//                                 ]
	//                             }
	//                         ]
	//                     }
	//                 ]
	//             },
	//             {
	//                 type: 'TextBlock',
	//                 text: codemark.text || codemark.title
	//             },
	//             {
	//                 type: 'Input.Text',
	//                 id: 'usertext',
	//                 placeholder: 'Compose a reply',
	//                 IsMultiline: true
	//             },
	//             {
	//                 type: 'TextBlock',
	//                 text: 'reply 2'
	//             },
	//             {
	//                 type: 'TextBlock',
	//                 text: 'reply 1',
	//                 separator: true
	//             },
	//         ],
	//         actions: [
	//             {
	//                 type: 'Action.Submit',
	//                 title: 'Submit',
	//                 data: {
	//                     codemark: codemark
	//                 }
	//             }
	//         ]
	//     });
	// }


	/* modal end */
}

module.exports = MSTeamsConversationBot;
