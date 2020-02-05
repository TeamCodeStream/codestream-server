// in many cases, MS bots are run in the own service, in our case
// it is part of the api_server.
// This BotFrameworkAdapter, provided by MS, should be used as a singleton, 
// as well as any bot that handles request (in our case the MSTeamsConversationBot)

'use strict';

const { BotFrameworkAdapter } = require('botbuilder');
const MSTeamsConfig = require(process.env.CS_API_TOP + '/config/msteams');

// using a single pattern for this class

const MSTeamsBotFrameworkAdapter = new BotFrameworkAdapter({
	appId: MSTeamsConfig.appClientId,
	appPassword: MSTeamsConfig.appClientSecret
});
MSTeamsBotFrameworkAdapter.onTurnError = async (context /*, error*/) => {
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

	// Send a message to the user
	await context.sendActivity('Oops, the bot encountered an issue.');
};

module.exports = MSTeamsBotFrameworkAdapter;
