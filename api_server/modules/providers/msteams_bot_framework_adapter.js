// in many cases, MS bots are run in the own service, in our case
// it is part of the api_server.
// This BotFrameworkAdapter, provided by MS, should be used as a singleton, 
// as well as any bot that handles request (in our case the MSTeamsConversationBot)

'use strict';

const { BotFrameworkAdapter } = require('botbuilder');
const MSTeamsConfig = require(process.env.CS_API_TOP + '/config/msteams');

// using a single pattern for this class

const MSTeamsBotFrameworkAdapter = new BotFrameworkAdapter({
	appId: MSTeamsConfig.botAppId,
	appPassword: MSTeamsConfig.botAppPassword
});

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
		const userState = await context.turnState.get('cs_stateAdapter');
		if (userState) {
			const property = userState.createProperty('codestreamUserId');
			if (property) {
				codeStreamUserId = await property.get(context);
			}
		}
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
			RequestId: options.requestId
		}, trackOptions);
	}
};

MSTeamsBotFrameworkAdapter.onTurnError = async (context, error) => {
	// This check writes out errors to console log .vs. app insights.
	// NOTE: In production environment, you should consider logging this to Azure
	//       application insights.
	//console.error(`\n [onTurnError] unhandled error: ${ error }`);

	// // Send a trace activity, which will be displayed in Bot Framework Emulator
	// await context.sendTraceActivity(
	//     'OnTurnError Trace',
	//     `${ error }`,
	//     'https://www.botframework.com/schemas/error',
	//     'TurnError'
	// );
	let logger;
	try {
		if (error) {
			logger = await context.turnState.get('cs_logger');

			let errorAsString = error.toString();
			if (errorAsString && errorAsString.indexOf('Error: ') === 0) {
				errorAsString = errorAsString.substring(7);
			}
			let errorMessage;
			const requestId = await context.turnState.get('cs_requestId');
			if (requestId) {
				errorMessage = `${errorAsString}. requestId=${requestId}`;
			}
			
			if (logger) {
				// log it internally
				logger.error(errorAsString);
			}
			// send back the message to the user
			await context.sendActivity(`Oops, the bot encountered an issue. ${errorMessage ? `\n\n${errorMessage}` : ''}`);
			try {
				// try to send telemetry about this error
				await sendTelemetry(context, errorAsString, { requestId: requestId});
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

module.exports = MSTeamsBotFrameworkAdapter;
