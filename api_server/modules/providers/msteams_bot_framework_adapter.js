const { ActionTypes, BotFrameworkAdapter, CardFactory } = require('botbuilder');
const MSTeamsConfig = require(process.env.CS_API_TOP + '/config/msteams');

let adapter;
class MSTeamsBotFrameworkAdapter {
    static instance () {
        if (!adapter) {
            // we want this to be a singleton
            adapter = new BotFrameworkAdapter({
                appId: MSTeamsConfig.appClientId,
                appPassword: MSTeamsConfig.appClientSecret // process.env.MicrosoftAppPassword
            });
            adapter.onTurnError = async (context, error) => {
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
        }
        return adapter;
    }
}

module.exports = MSTeamsBotFrameworkAdapter;
