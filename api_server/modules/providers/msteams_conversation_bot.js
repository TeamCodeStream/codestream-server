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
// const HELP_URL = 'https://docs.newrelic.com/docs/codestream/codestream-integrations/msteams-integration/';
// Keys of properties used to store 
const STATE_PROPERTY_WELCOMED_USER = 'welcomedUser';
const STATE_PROPERTY_CODESTREAM_USER_ID = 'codestreamUserId';

const OPEN_EXTERNAL_LINK_ICON = 'https://images.codestream.com/misc/link-external_transparent-32x32.png';

class MSTeamsConversationBot extends TeamsActivityHandler {
	// note this is a singleton, and no instance members should be used
	constructor () {
		super();

		this.onInstallationUpdateAdd(async (context, next) => {
			if (context.activity.conversation.conversationType === 'personal') {
				await this.botInstalledPersonal(context);
			}
			await next();
		});

		this.onMessage(async (context, next) => {
			try {
				// this needs to be run before we access the text as it 
				// removes the <at>CodeStream</at> part of 
				TurnContext.removeRecipientMention(context.activity);
				const text = context.activity.text.trim();

				// store this for possible error logging later
				await context.turnState.set('cs_bot_text', text);
				const didBotWelcomeUser = await this.getState(context, STATE_PROPERTY_WELCOMED_USER, false);

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
						await this.helpPersonal(context, userName);
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
						await this.setState(context, STATE_PROPERTY_CODESTREAM_USER_ID, result.codeStreamUserId);
						await context.sendActivity('Next step, go to any channel where you\'d like to use CodeStream, type `@`, select `Get bots` and then select the CodeStream bot. Once you\'ve added the bot, mention it with the `connect` command.');
					}
					else {
						await context.sendActivity('Oops, we hit a snag trying to connect to CodeStream. Please try signing in again!');
					}
				}
				else {
					switch (text.toLocaleLowerCase()) {
						// start secret commands
						case 'install':
							await this.botInstalledPersonal(context);
							break;
						case 'easteregg':
							await this.easterEgg(context);
							break;
						case 'debug':
							await this.debug(context);
							break;
						case 'status':
							if (teamId) {
								await this.status(context);
							}
							else {
								await this.statusPersonal(context);
							}
							break;
						case 'uninstall':
							await this.uninstall(context);
							break;
						case 'disconnectall':
						case 'disconnect-all':
							if (teamId) {
								await this.disconnectAll(context, context.activity, teamDetails, teamChannels, channelData.tenant.id);
							}
							break;
							// end secret commands

						// start personal commands
						case 'login':
						case 'signin':
							if (teamId) {
								await context.sendActivity(PERSONAL_BOT_MESSAGE);
							}
							else {
								await this.signin(context);
							}
							break;
						case 'signup':
							if (teamId) {
								await context.sendActivity(PERSONAL_BOT_MESSAGE);
							}
							else {
								await this.signup(context);
							}
							break;
						case 'logout':
						case 'signout':
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
							if (teamId) {
								await this.connect(context, context.activity, teamDetails, teamChannels, teamMembers, channelData.tenant.id);
							}
							else {
								await context.sendActivity(TEAM_BOT_MESSAGE);
							}
							break;
						case 'disconnect':
							if (teamId) {
								await this.disconnect(context, context.activity, teamDetails, teamChannels, channelData.tenant.id);
							}
							else {
								await context.sendActivity(TEAM_BOT_MESSAGE);
							}
							break;
							// end commands that work in public chats/teams

						// start commands that work everywhere			
						case 'welcome':
						case 'start':
						case 'init':
						case 'initialize':
						case 'ok':
						case 'go':
						case 'getstarted':
						case 'help':
							if (teamId) {
								await this.help(context);
							}
							else {
								await this.helpPersonal(context);
							}
							break;
						default:
							await context.sendActivity(`Sorry, I didn't understand '${text}', but thanks for checking out CodeStream. Type 'help' if you need assistance.`);
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
			await context.sendActivity(MessageFactory.text('Please run the `signin` command from the personal CodeStream bot chat before connecting.'));
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
						await context.sendActivity(MessageFactory.text('Please run the `signin` command from the personal CodeStream bot chat before connecting.'));
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
			await context.sendActivity(MessageFactory.text('Please run the `signin` command from the personal CodeStream bot chat before disconnecting.'));
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
			await context.sendActivity(MessageFactory.text('Please run the `signin` command from the personal CodeStream bot chat before disconnecting all.'));
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
			await context.sendActivity(MessageFactory.text('Please run the `signin` command from the personal CodeStream bot chat before signing out.'));
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
		const codeStreamUserId = await this.getState(context, STATE_PROPERTY_CODESTREAM_USER_ID);
		const tenantId = context.activity.channelData.tenant.id;
		const serverDebug = await context.turnState.get('cs_databaseAdapter').debug({
			tenantId: tenantId
		});
		const debug = {
			api: this.publicApiUrl,
			tenantId: tenantId,
			codeStreamUserId: codeStreamUserId
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

			let body = [];

			body.push({
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
			});

			await this.sendAdaptiveCard(context, body);
		}
		else {
			await context.sendActivity(MessageFactory.text('Status Unknown'));
		}
	}

	async statusPersonal (context) {
		const codeStreamUserId = await this.getState(context, STATE_PROPERTY_CODESTREAM_USER_ID);
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

			let body = [];
			
			body.push({
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
			},
			{
				type: 'TextBlock',
				size: 'Medium',
				weight: 'Bolder',
				text: `Your CodeStream userId: ${codeStreamUserId}`
			});


			await this.sendAdaptiveCard(context, body);
		}
		else {
			await context.sendActivity(MessageFactory.text('Status Unknown'));
		}
	}

	// uninstalls the app from the CS team based on the tenantId
	// will only work if there is 1 CS team attached
	async uninstall (context) {
		const codeStreamUserId = await this.getState(context, STATE_PROPERTY_CODESTREAM_USER_ID);
		if (!codeStreamUserId) {
			await context.sendActivity(MessageFactory.text('Please run the `signin` command from the personal CodeStream bot chat before uninstalling.'));
		} else {
			const result = await context.turnState.get('cs_databaseAdapter').uninstall({
				tenantId: context.activity.channelData.tenant.id
			});

			await context.sendActivity(MessageFactory.text(`Uninstall ${result ? 'succeeded' : 'failed'}`));
		}
	}

	// returns a way for a user to signin if their team is not connected
	async signin (context) {
		let body = [];

		body.push({
			type: 'TextBlock',
			text: `Sign in to CodeStream to get started!`,
			wrap: true,
		},
		{
			type: 'ActionSet',
			actions: [
				{
					type: 'Action.OpenUrl',
					title: 'Sign in',
					url: `${this.publicApiUrl}/web/login?tenantId=${context.activity.channelData.tenant.id}`,
					iconUrl: OPEN_EXTERNAL_LINK_ICON
				}
			]
		});

		await this.sendAdaptiveCard(context, body);
		await context.sendActivity('After signing in, please copy the code shown on your screen and paste it here.');
	}

	// provides a way for a user to signup
	async signup (context) {
		let body = [];

		body.push({
			type: 'TextBlock',
			text: `Download the CodeStream IDE extension to get started!`,
			wrap: true,
		},
		{
			type: 'ActionSet',
			actions: [
				{
					type: 'Action.OpenUrl',
					title: 'Sign up',
					url: 'https://www.codestream.com',
					iconUrl: OPEN_EXTERNAL_LINK_ICON
				}
			]
		});

		await this.sendAdaptiveCard(context, body);
	}

	async botInstalledPersonal (context) {
		let body = [];

		body.push({
			type: 'TextBlock',
			size: 'Medium',
			text: 'Welcome to New Relic CodeStream for Microsoft Teams!',
			wrap: true,
			color: 'good',
			weight: 'bolder',
			size: 'large',
			horizontalAlignment: 'center',
		},
		{
			type: 'TextBlock',
			text: `The CodeStream bot allows you to share discussions from CodeStream to any channel on Teams. If you already have a CodeStream account, click the **Sign In** button to get started.`,
			wrap: true,
		},
		{
			type: 'ActionSet',
			actions: [
				{
					type: 'Action.OpenUrl',
					title: 'Sign In',
					url: `${this.publicApiUrl}/web/login?tenantId=${context.activity.channelData.tenant.id}`,
					iconUrl: OPEN_EXTERNAL_LINK_ICON
				}
			]
		},
		{
			type: 'TextBlock',
			text: `Click the **Detailed Instructions** button to get more detailed information about our Teams integration including a full list of available commands. If you need a CodeStream account, click **Download CodeStream** button to get started!`,
			wrap: true,
		},
		{
			type: 'ActionSet',
			actions: [
				{
					type: 'Action.OpenUrl',
					title: 'Detailed Instructions',
					url: 'https://docs.newrelic.com/docs/codestream/codestream-integrations/msteams-integration/',
					iconUrl: OPEN_EXTERNAL_LINK_ICON
				},
				{
					type: 'Action.OpenUrl',
					title: 'Download CodeStream',
					url: 'https://www.codestream.com',
					iconUrl: OPEN_EXTERNAL_LINK_ICON
				}
			]
		},
		{
			type: 'TextBlock',
			text: `You can always type **help** to get full list of available commands`,
			wrap: true
		},
		{
			type: 'ActionSet',
			actions: [
				{
					type: 'Action.ShowCard',
					title: 'Help',
					card: {
						type: 'AdaptiveCard',
						body: [
							{
								type: "TextBlock",
								text: "Here's a list of personal commands I can process:\r",
								wrap: true
							},
							{
								type: "TextBlock",
								text: "- **help** - view list of available commands\r- **signin** - sign in to CodeStream\r- **signup** - sign up for CodeStream\r- **signout** - sign out of CodeStream\r\r",
								wrap: true
							},
							{
								type: "TextBlock",
								text: "Here's a list of channel commands I can process:\r",
								wrap: true
							},
							{
								type: "TextBlock",
								text: "- **connect** - connect a Teams channel to CodeStream\r- **disconnect** - disconnect a Teams channel from CodeStream",
								wrap: true
							}
						]
					}
				}
			]
		});

		await this.sendAdaptiveCard(context, body);
	}

	async help (context) {
		let body = [];

		body.push({
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
		},
		{
			type: 'TextBlock',
			text: `If you already have a CodeStream account, click the **Sign In** button to get started.`,
			wrap: true,
		},
		{
			type: 'ActionSet',
			actions: [
				{
					type: 'Action.OpenUrl',
					title: 'Sign In',
					url: `${this.publicApiUrl}/web/login?tenantId=${context.activity.channelData.tenant.id}`,
					iconUrl: OPEN_EXTERNAL_LINK_ICON
				}
			]
		},
		{
			type: 'TextBlock',
			text: `Click the **Detailed Instructions** button to get more detailed information about our Teams integration including a full list of available commands. If you need a CodeStream account, click **Download CodeStream** button to get started!`,
			wrap: true,
		},
		{
			type: 'ActionSet',
			actions: [
				{
					type: 'Action.OpenUrl',
					title: 'Detailed Instructions',
					url: 'https://docs.newrelic.com/docs/codestream/codestream-integrations/msteams-integration/',
					iconUrl: OPEN_EXTERNAL_LINK_ICON
				},
				{
					type: 'Action.OpenUrl',
					title: 'Download CodeStream',
					url: 'https://www.codestream.com',
					iconUrl: OPEN_EXTERNAL_LINK_ICON
				}
			]
		},
		{
			type: 'TextBlock',
			text: `You can always type **help** to get full list of available commands`,
			wrap: true
		});

		await this.sendAdaptiveCard(context, body);
	}

	async helpPersonal (context, userName) {
		let body = [];
		
		if (userName) {
			body.push({
				type: 'TextBlock',
				size: 'Medium',
				text: `Hey ${userName}, welcome to CodeStream!`,
				wrap: true
			});
		}

		body.push({
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
		},
		{
			type: 'TextBlock',
			text: `If you already have a CodeStream account, click the **Sign In** button to get started.`,
			wrap: true,
		},
		{
			type: 'ActionSet',
			actions: [
				{
					type: 'Action.OpenUrl',
					title: 'Sign In',
					url: `${this.publicApiUrl}/web/login?tenantId=${context.activity.channelData.tenant.id}`,
					iconUrl: OPEN_EXTERNAL_LINK_ICON
				}
			]
		},
		{
			type: 'TextBlock',
			text: `Click the **Detailed Instructions** button to get more detailed information about our Teams integration including a full list of available commands. If you need a CodeStream account, click **Download CodeStream** button to get started!`,
			wrap: true,
		},
		{
			type: 'ActionSet',
			actions: [
				{
					type: 'Action.OpenUrl',
					title: 'Detailed Instructions',
					url: 'https://docs.newrelic.com/docs/codestream/codestream-integrations/msteams-integration/',
					iconUrl: OPEN_EXTERNAL_LINK_ICON
				},
				{
					type: 'Action.OpenUrl',
					title: 'Download CodeStream',
					url: 'https://www.codestream.com',
					iconUrl: OPEN_EXTERNAL_LINK_ICON
				}
			]
		},
		{
			type: 'TextBlock',
			text: `You can always type **help** to get full list of available commands`,
			wrap: true
		});

		await this.sendAdaptiveCard(context, body);
        await context.sendActivity('After signing in, please copy the code shown on your screen and paste it here.');
	}

	async sendAdaptiveCard(context, body){
		const payload = {
			type: 'AdaptiveCard',
			body: body,
			'$schema': 'http://adaptivecards.io/schemas/adaptive-card.json',
			version: '1.4'
		};

		await context.sendActivity({
			attachments: [CardFactory.adaptiveCard(payload)]
		});
	}
}

module.exports = new MSTeamsConversationBot();
