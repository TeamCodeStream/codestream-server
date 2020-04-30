// in many cases, MS bots are run in the own service, in our case
// it is part of the api_server.
// This BotFrameworkAdapter, provided by MS, should be used as a singleton, 
// as well as any bot that handles request (in our case the MSTeamsConversationBot)

'use strict';

/* eslint no-empty: 0 */
const { BotFrameworkAdapter } = require('botbuilder');

let initialized = undefined;

// using a single pattern for this class
let msTeamsBotFrameworkAdapter;

const sendTelemetry = async function (context, errorString, options = {}) {
	const analytics = await context.turnState.get('cs_analytics');
	if (!analytics) return;

	const channelData = context.activity.channelData;
	let tenantId;
	if (channelData) {
		tenantId = channelData.tenant.id;
	}
	else if (context.activity.conversation) {
		tenantId = context.activity.conversation.tenantId;
	}
	// try to get the user's id explicitly -- it will be there when 
	// a user is sharing a codemark from CS
	let codeStreamUserId = await context.turnState.get('cs_userId');
	if (!codeStreamUserId) {
		// if not, try to get it from the state object (this would be a user
		// that has auth'd with CS from the bot)
		try {
			const userState = await context.turnState.get('cs_stateAdapter');
			if (userState) {
				const property = userState.createProperty('codestreamUserId');
				if (property) {
					// this can throw if there's a db issue
					codeStreamUserId = await property.get(context);
				}
			}
		}
		catch (ex) { }
	}

	let trackOptions = {};
	if (codeStreamUserId) {
		trackOptions.userId = codeStreamUserId;
	}
	else if (context.activity.from && context.activity.from.id) {
		trackOptions.anonymousId = context.activity.from.id;
	}
	if (trackOptions.userId || trackOptions.anonymousId) {
		analytics.track('Bot Error', {
			TenantId: tenantId,
			Destination: 'MSTeams',
			Error: errorString,
			RequestId: options.requestId,
			CommandText: options.commandText
		}, trackOptions);
	}
};

// list of commands that we care about seeing in logs/telemetry
const commandWhiteList = new Set([
	'easteregg',
	'debug',
	'status',
	'uninstall',
	'disconnectall',
	'disconnect-all',
	'login',
	'signin',
	'signup',
	'logout',
	'signout',
	'connect',
	'disconnect',
	'welcome',
	'start',
	'init',
	'initialize',
	'ok',
	'go',
	'getstarted',
	'help'
]);

module.exports.createMSTeamsBotFrameworkAdapter = async (request) => {
	if (initialized) return msTeamsBotFrameworkAdapter;

	// cheese pizza @jj need the correct path to MSTteams here!!!!
	msTeamsBotFrameworkAdapter = new BotFrameworkAdapter({
		appId: request.api.config.teams.botAppId,
		appPassword: request.api.config.teams.botAppPassword
	});

	msTeamsBotFrameworkAdapter.onTurnError = async (context, error) => {
		let logger;
		try {
			if (error) {
				let originalError;
				let isApiError = false;
				let errorAsString;
				//check if the error is an api_server error
				if (error.code && error.description) {
					isApiError = true;
					originalError = error;
					// replace the error with one in a format we're expecting
					error = new Error(`${error.code} ${error.description}`);
				}
				logger = await context.turnState.get('cs_logger');
				let commandText = await context.turnState.get('cs_bot_text');
				// only show commands that we know about, just for a bit of user privacy
				if (commandText && !commandWhiteList.has(commandText.toLowerCase())) {
					commandText = 'unknown';
				}
				if (!commandText) {
					commandText = 'unknown';
				}

				errorAsString = error.toString();
				if (errorAsString && errorAsString.indexOf('Error: ') === 0) {
					errorAsString = errorAsString.substring(7);
				}
				let userErrorMessage;
				const requestId = await context.turnState.get('cs_requestId');
				if (requestId) {
					userErrorMessage = `${errorAsString}. requestId=${requestId}`;
				}

				if (logger) {
					// log it internally
					if (isApiError && originalError) {
						logger.error(JSON.stringify(originalError));
					}
					else {
						logger.error(errorAsString);
					}
				}
				// send back the message to the user
				await context.sendActivity(`Oops, the bot encountered an issue. ${userErrorMessage ? `\n\n${userErrorMessage}` : ''}`);
				try {
					// try to send telemetry about this error
					await sendTelemetry(context, errorAsString, {
						requestId: requestId,
						commandText: commandText
					});
				}
				catch (ex) {
					if (logger) {
						logger.error(ex.toString());
					}
				}

				// when we continueConversation (share a codemark), and we end up here, 
				// we need to re-throw this error so that it ends up with a 4XX response
				// in the agent
				const throwOnError = await context.turnState.get('cs_throwOnError');
				if (throwOnError) {
					throw error;
				}
			}
		}
		catch (ex) {
			if (logger) {
				logger.error(ex.toString());
			}
		}
	};

	initialized = true;

	return msTeamsBotFrameworkAdapter;
};
