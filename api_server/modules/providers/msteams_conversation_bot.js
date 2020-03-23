// this is the actual MS Teams bot implementation
// it handles messages with the onMessage handler, passing any data-oriented
// operations to a database adapter, then finally posting a message back to the user via sendActivity

// certain commands only work in certain instances (personal bot channel vs. a "public" channel) -- they are grouped
// in the switch statement

/*eslint complexity: ["error", 666]*/
const {
	ActionTypes,
	MessageFactory,
	CardFactory,
	TeamsInfo,
	TeamsActivityHandler,
	TurnContext
} = require('botbuilder');

const PERSONAL_BOT_MESSAGE = 'Please run this command from your personal bot chat.';
const TEAM_BOT_MESSAGE = 'Please run this command from a team channel.';
// const HELP_URL = 'https://github.com/TeamCodeStream/CodeStream/wiki/Microsoft-Teams-Integration';
// Keys of properties used to store 
const STATE_PROPERTY_WELCOMED_USER = 'welcomedUser';
const STATE_PROPERTY_CODESTREAM_USER_ID = 'codestreamUserId';

class MSTeamsConversationBot extends TeamsActivityHandler {
	// note this is a singleton, and no instance members should be used
	constructor () {
		super();

		// called for any incoming conversation update activity that includes 
		// members added to the conversation. this is what is called right after a bot is installed
		this.onMembersAdded(async (context, next) => {
			// Iterate over all new members added to the conversation
			for (const idx in context.activity.membersAdded) {
				// Greet anyone that was not the target (recipient) of this message.
				// Since the bot is the recipient for events from the channel,
				// context.activity.membersAdded === context.activity.recipient.Id indicates the
				// bot was added to the conversation, and the opposite indicates this is a user.
				if (context.activity.membersAdded[idx].id !== context.activity.recipient.id) {
					await context.sendActivity('CodeStream is a collaboration platform for software developers that allows them to easily discuss and review code right inside their IDE.');
					await context.sendActivity('The CodeStream bot allows you to share discussions from CodeStream to any channel on Teams.');
				}
			}
			// By calling next() you ensure that the next BotHandler is run.
			await next();
		});

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
			const didBotWelcomeUser = await this.getState(context, STATE_PROPERTY_WELCOMED_USER, false);
			// this needs to be run before we access the text as it 
			// removes the <at>CodeStream</at> part of 
			TurnContext.removeRecipientMention(context.activity);
			const text = context.activity.text.trim();

			try {
				// store this for possible error logging later
				await context.turnState.set('cs_bot_text', text);
				let teamDetails;
				let teamChannels;				
				let teamMembers;
				const channelData = context.activity.channelData;
				const team = channelData && channelData.team ? channelData.team : undefined;
				const teamId = team && typeof (team.id) === 'string' ? team.id : undefined;
				const isPersonalChat = teamId === undefined;

				// not checking type since this can return undefined
				if (!didBotWelcomeUser && isPersonalChat) {
					// if we haven't welcomed this user AND their first command isn't signin, 
					// AND they're in a personal chat
					// give them some additional info
					if (text !== 'signin') {
						const userName = context.activity.from.name;
						await context.sendActivity(`Hey ${userName}, welcome to CodeStream!`);
						await context.sendActivity('Issue the `signin` command to get started.');
						await this.setState(context, STATE_PROPERTY_WELCOMED_USER, true);
						return;
					}
					// Set the flag indicating the bot handled the user's first message.
					await this.setState(context, STATE_PROPERTY_WELCOMED_USER, true);
				}

				if (teamId) {
					teamDetails = await TeamsInfo.getTeamDetails(context);
					teamChannels = await TeamsInfo.getTeamChannels(context);
					// NOTE: "members" works without a teamId
					// members = await TeamsInfo.getMembers(context);
					teamMembers = await TeamsInfo.getTeamMembers(context);
				}

				// if this looks like a guid without hypens (aka a signup token...)
				if (text.match(/^[0-9a-f]{8}[0-9a-f]{4}[0-5][0-9a-f]{3}[089ab][0-9a-f]{3}[0-9a-f]{12}$/i)) {
					const result = await context.turnState.get('cs_databaseAdapter').complete({
						tenantId: channelData.tenant.id,
						token: text
					});
					if (result && result.success) {
						// TODO this might work as a way to mention the bot and make it clickable
						// const mention = {
						//     mentioned: context.activity.from,
						//     text: `<at>${new TextEncoder().encode(context.activity.from.name)}</at>`,
						//     type: 'mention'
						// };
						// const replyActivity = MessageFactory.text(`Hi ${mention.text}`);
						// replyActivity.entities = [mention];
						// await context.sendActivity(replyActivity);

						await this.setState(context, STATE_PROPERTY_CODESTREAM_USER_ID, result.codeStreamUserId);
						await context.sendActivity('Ok, now one more step. Mention the CodeStream bot with the `connect` command in any team channel where you\'d like to use CodeStream.');
					}
					else {
						await context.sendActivity('Oops, we hit a snag trying to connect to CodeStream. Please try signing in again!');
					}
				}
				else {
					switch (text) {
					// start secret commands
					case 'EasterEgg':
					case 'easterEgg':
					case 'easteregg':
						await this.easterEgg(context);
						break;
					case 'debug':
						await this.debug(context);
						break;
					case 'status':
						await this.status(context);
						break;
					case 'uninstall':
						await this.uninstall(context);
						break;
					case 'disconnectall':
					case 'disconnect-all':
					case 'DisconnectAll':
						if (teamId) {
							await this.disconnectAll(context, context.activity, teamDetails, teamChannels, channelData.tenant.id);
						}
						break;
						// end secret commands

					// start personal commands
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
						// end personal commands

					// start commands that work in public chats/teams
					case 'connect':
					case 'Connect':
						if (teamId) {
							await this.connect(context, context.activity, teamDetails, teamChannels, teamMembers, channelData.tenant.id);
						}
						else {
							await context.sendActivity(TEAM_BOT_MESSAGE);
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
						// end commands that work in public chats/teams

					// start commands that work everywhere			
					case 'Welcome':
					case 'welcome':
					case 'start':
					case 'init':
					case 'initialize':
					case 'ok':
					case 'go':
					case 'getstarted':
					case 'Help':
					case 'help':
						if (teamId) {
							await this.help(context);
						}
						else {
							await this.helpPersonal(context);
						}
						break;
					default:
						await context.sendActivity('I\'m not sure about that command, but thanks for checking out CodeStream. Type the `help` if you need anything.');
						break;
						// end commands that work everywhere
					}
				}
			}
			finally {
				// we don't need a catch here since the global
				// error handler in MSTeamsBotFrameworkAdapter will capture it

				// Save state changes
				await this.saveState(context);
				await next();
			}
		});
	}

	// assign any request-specific data on the first instance
	initialize (options) {
		Object.assign(this, options);
	}


	/**
	 * Fetch properties from the user state 
	 * 
	 * @param  {object} context the MST context object
	 * @param  {string} key the key of the data
	 * @param  {object} defaultValue if supplied, will return this value instead of undefined
	 */
	async getState (context, key, defaultValue) {
		const userState = await context.turnState.get('cs_stateAdapter');
		if (!userState) return undefined;

		const property = userState.createProperty(key);
		if (!property) return undefined;

		return await property.get(context, defaultValue);
	}

	/**
	 * Set properties into the user state 
	 * 
	 * @param  {object} context the MST context object
	 * @param  {string} key the key of the data
	 * @param  {object} value the value of this key
	 */
	async setState (context, key, value) {
		const userState = await context.turnState.get('cs_stateAdapter');
		if (!userState) return false;

		const property = userState.createProperty(key);
		if (!property) return false;

		await property.set(context, value);
		return true;
	}

	/**
	 * Deletes all keys for this user
	 * 
	 * @param  {object} context the MST context object
	 */
	async deleteState (context) {
		const userState = await context.turnState.get('cs_stateAdapter');
		if (!userState) return false;

		await userState.delete(context);
		return true;
	}

	/**
	 * Save the state of this user. This should usually be run once per request (at the end)
	 * 
	 * @param  {object} context the MST context object
	 */
	async saveState (context) {
		const userState = await context.turnState.get('cs_stateAdapter');
		if (!userState) return;

		await userState.saveChanges(context);
	}

	// connects the channel to CodeStream
	async connect (context, activity, teamDetails, teamChannels, teamMembers, tenantId) {
		const codeStreamUserId = await this.getState(context, STATE_PROPERTY_CODESTREAM_USER_ID);
		if (!codeStreamUserId) {
			await context.sendActivity(MessageFactory.text('Oops, we had a problem connecting to CodeStream. Have you signed in before?'));
		} else {
			const conversationReference = TurnContext.getConversationReference(activity);
			const result = await context.turnState.get('cs_databaseAdapter').connect({
				conversation: conversationReference,
				team: teamDetails,
				tenantId: tenantId,
				teamChannels: teamChannels,
				teamMembers: teamMembers,
				codeStreamUserId: codeStreamUserId
			});
			if (result) {
				if (result.success) {
					await context.sendActivity('This channel is now ready to receive messages from CodeStream.');
				}
				else {
					if (result.reason === 'signin') {
						await context.sendActivity(MessageFactory.text('Oops, we had a problem connecting CodeStream to this conversation. Have you issued the `signin` command from the personal bot chat yet?'));
					}
					else {
						await context.sendActivity(MessageFactory.text('Oops, we had a problem connecting CodeStream to this conversation. Please try again.'));
					}
				}
			}
			else {
				await context.sendActivity(MessageFactory.text('Oops, we had a problem connecting CodeStream to this conversation. Please try again.'));
			}
		}
	}

	// disconnects the channel from CodeStream
	async disconnect (context, activity, teamDetails, teamChannels, tenantId) {
		const codeStreamUserId = await this.getState(context, STATE_PROPERTY_CODESTREAM_USER_ID);
		if (!codeStreamUserId) {
			await context.sendActivity(MessageFactory.text('Oops, we had a problem disconnecting from CodeStream. Have you signed in before?'));
		} else {
			const conversationReference = TurnContext.getConversationReference(activity);
			const result = await context.turnState.get('cs_databaseAdapter').disconnect({
				conversation: conversationReference,
				team: teamDetails,
				tenantId: tenantId,
				teamChannels: teamChannels
			});

			if (result && result.success) {
				await context.sendActivity(MessageFactory.text('CodeStream has been disconnected from this channel.'));
			}
			else {
				await context.sendActivity(MessageFactory.text('Oops, we had a problem disconnecting CodeStream from this conversation. Please try again.'));
			}
		}
	}

	// secret command: disconnects all the teams, aka removes them from msteams_team collection
	async disconnectAll (context, activity, teamDetails, teamChannels, tenantId) {
		const codeStreamUserId = await this.getState(context, STATE_PROPERTY_CODESTREAM_USER_ID);
		if (!codeStreamUserId) {
			await context.sendActivity(MessageFactory.text('Oops, we had a problem disconnecting all from CodeStream. Have you signed in before?'));
		} else {
			const result = await context.turnState.get('cs_databaseAdapter').disconnectAll({
				teamId: teamDetails.id,
				tenantId: tenantId
			});

			if (result && result.success) {
				await context.sendActivity(MessageFactory.text('CodeStream has been disconnected from all conversations.'));
			}
			else {
				await context.sendActivity(MessageFactory.text('Oops, we had a problem disconnecting CodeStream from all conversations. Please try again.'));
			}
		}
	}

	// signs the current user out of CodeStream (assuming they have signed in before)
	async signout (context) {
		const codeStreamUserId = await this.getState(context, STATE_PROPERTY_CODESTREAM_USER_ID);
		if (!codeStreamUserId) {
			await context.sendActivity(MessageFactory.text('Oops, we had a problem signing you out of CodeStream. Have you signed in before?'));

		} else {
			const result = await context.turnState.get('cs_databaseAdapter').signout({
				tenantId: context.activity.channelData.tenant.id,
				codeStreamUserId: codeStreamUserId
			});
			if (result && result.success) {
				await context.sendActivity(MessageFactory.text('You have been signed out of CodeStream.'));
				await this.deleteState(context);
			}
			else {
				await context.sendActivity(MessageFactory.text('Oops, we had a problem signing you out of CodeStream. Please try again.'));
			}
		}
	}

	// secret command: you're awesome!
	async easterEgg (context) {
		await context.sendActivity(MessageFactory.text('You\'re awesome!'));
	}

	// sends out some debugging info
	async debug (context) {
		const tenantId = context.activity.channelData.tenant.id;
		const serverDebug = await context.turnState.get('cs_databaseAdapter').debug({
			tenantId: tenantId
		});
		const debug = {
			api: this.publicApiUrl,
			tenantId: tenantId
		};
		await context.sendActivity(MessageFactory.text(JSON.stringify({ ...serverDebug, ...debug }, null, 4)));
	}

	async status (context) {
		const tenantId = context.activity.channelData.tenant.id;
		const results = await context.turnState.get('cs_databaseAdapter').status({
			tenantId: tenantId
		});
		if (results && results.teams) {
			const facts = results.teams.map(_ => {
				return {
					title: _.get('name'),
					value: 'connected'
				};
			});
			const payload = {
				type: 'AdaptiveCard',
				body: [
					{
						type: 'TextBlock',
						size: 'Medium',
						weight: 'Bolder',
						text: 'CodeStream Teams'
					},
					{
						type: 'ColumnSet',
						columns: [
							{
								type: 'Column',
								items: [
									{
										type: 'FactSet',
										facts: facts
									}
								],
								width: 'stretch'
							}
						]
					}
				],
				'$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
				version: '1.0'
			};

			await context.sendActivity({
				attachments: [CardFactory.adaptiveCard(payload)]
			});
		}
		else {
			await context.sendActivity(MessageFactory.text('Status Unknown'));
		}
	}

	// uninstalls the app from the CS team based on the tenantId
	// will only work if there is 1 CS team attached
	async uninstall (context) {
		const result = await context.turnState.get('cs_databaseAdapter').uninstall({
			tenantId: context.activity.channelData.tenant.id
		});

		await context.sendActivity(MessageFactory.text(`Uninstall ${result ? 'succeeded' : 'failed'}`));
	}

	// returns a way for a user to signin if their team is not connected
	async signin (context) {
		// NOTE this can also work, but it's styling is a little chunky
		// const card = CardFactory.signinCard("Sign in", `${this.api.config.api.publicApiUrl}/web/login?tenantId=` + context.activity.channelData.tenant.id, "Sign in to CodeStream to get started!");
		const card = CardFactory.heroCard('', 'Sign in to CodeStream to get started!', null,
			[
				{
					type: ActionTypes.OpenUrl,
					title: 'Sign in',
					value: `${this.publicApiUrl}/web/login?tenantId=${context.activity.channelData.tenant.id}`
				}
			]);

		await context.sendActivity({
			attachments: [card]
		});
		await context.sendActivity(MessageFactory.text('After signing in, please copy the code shown on your screen and paste it here.'));
	}

	// provides a way for a user to signup
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

	// returns a link for help
	async help (context) {
		const payload = {
			type: 'AdaptiveCard',
			body: [
				{
					type: 'TextBlock',
					size: 'Medium',
					text: 'The CodeStream bot allows you to share discussions from CodeStream to any channel on Teams. You can use any of the following commands:',
					wrap: true
				},
				{
					type: 'ColumnSet',
					columns: [
						{
							type: 'Column',
							items: [
								{
									type: 'FactSet',
									facts: [
										{
											title: 'connect',
											value: 'Connect this channel to CodeStream.'
										},
										{
											title: 'disconnect',
											value: 'Disconnect this channel from CodeStream.'
										}
									]
								}
							],
							width: 'stretch'
						}
					]
				}
			],
			'$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
			version: '1.0'
		};

		await context.sendActivity({
			attachments: [CardFactory.adaptiveCard(payload)]
		});
	}

	async helpPersonal (context) {
		const payload = {
			type: 'AdaptiveCard',
			body: [
				{
					type: 'TextBlock',
					size: 'Medium',
					text: 'The CodeStream bot allows you to share discussions from CodeStream to any channel on Teams. You can use any of the following commands:',
					wrap: true
				},
				{
					type: 'ColumnSet',
					columns: [
						{
							type: 'Column',
							items: [
								{
									type: 'FactSet',
									facts: [
										{
											title: 'signin',
											value: 'Sign in to start using CodeStream.'
										},
										{
											title: 'signout',
											value: 'Sign out of CodeStream.'
										}
									]
								}
							],
							width: 'stretch'
						}
					]
				}
			],
			'$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
			version: '1.0'
		};

		await context.sendActivity({
			attachments: [CardFactory.adaptiveCard(payload)]
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

module.exports = new MSTeamsConversationBot();
