const {
    TurnContext,
    MessageFactory,
    TeamsInfo,
    TeamsActivityHandler,
    CardFactory,
    ActionTypes
} = require('botbuilder');
const TextEncoder = require('util').TextEncoder;
class MSTeamsConversationBot extends TeamsActivityHandler {
    constructor () {
        super();

        // this.onConversationUpdate(async (context, next) => {
        //     console.log(JSON.stringify(context.activity));
        //     await context.sendActivity("conversation update");

        //     await next();
        // });

        // TODO implement me?
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

        this.onMessage(async (context, next) => {
            let teamDetails;
            let teamChannels;
            let members;
            let teamMembers;

            const channelData = context.activity.channelData;
            const team = channelData && channelData.team ? channelData.team : undefined;
            const teamId = team && typeof (team.id) === 'string' ? team.id : undefined;
            if (teamId) {
                teamDetails = await TeamsInfo.getTeamDetails(context);
                teamChannels = await TeamsInfo.getTeamChannels(context);
                members = await TeamsInfo.getMembers(context);
                teamMembers = await TeamsInfo.getTeamMembers(context);
            }
            else {
                members = await TeamsInfo.getMembers(context);
            }

            TurnContext.removeRecipientMention(context.activity);

            const text = context.activity.text.trim();
            if (text.match(/^[0-9a-f]{8}[0-9a-f]{4}[0-5][0-9a-f]{3}[089ab][0-9a-f]{3}[0-9a-f]{12}$/i)) {
                const result = await this.databaseAdapter.complete({
                    tenantId: channelData.tenant.id,
                    token: text
                });
                if (result.success) {
                    // const mention = {
                    //     mentioned: context.activity.from,
                    //     text: `<at>${new TextEncoder().encode(context.activity.from.name)}</at>`,
                    //     type: 'mention'
                    // };

                    // const replyActivity = MessageFactory.text(`Hi ${mention.text}`);
                    // replyActivity.entities = [mention];
                    // await context.sendActivity(replyActivity);

                    await context.sendActivity(`Ok, now one more step. Mention the CodeStream bot with the \`connect\` command in any team channel where you'd like to use CodeStream.`);
                }
                else {
                    await context.sendActivity(`Oops, we hit a snag trying to connect to CodeStream. Please try signing in again!`);
                }
            }
            else {
                switch (text) {
                    case 'Help':
                    case 'help':
                        await this.helpAsync(context);
                        break;
                    case 'EasterEgg':
                    case 'easterEgg':
                    case 'easteregg':
                        await this.easterEgg(context);
                        break;
                    case 'disconnect':
                    case 'Disconnect':
                        await this.disconnect(context);
                        break;
                    case 'logout':
                    case 'Logout':
                    case 'signout':
                    case 'Signout':
                        await this.signout(context);
                        break;
                    case 'Login':
                    case 'login':
                    case 'Signin':
                    case 'signin':
                        await this.signin(context);
                        break;
                    case 'connect':
                    case 'Connect':
                        if (teamId) {
                            await this.connect(context.activity, teamDetails, teamChannels, channelData.tenant.id);
                            await context.sendActivity(`Your team is now ready to receive messages from CodeStream.`);
                        }
                        else {
                            //could not connect without a teamId aka channel                            
                        }

                        break;
                    case 'Welcome':
                    default:
                        // only add the conversation reference to public channels
                        // if (teamId) {
                        //     await this.addConversationReference(context.activity, teamDetails, teamChannels, channelData.tenant.id);
                        // }
                        // const value = { count: 0 };
                        // const card = CardFactory.heroCard(
                        //     'Welcome Card',
                        //     null,
                        //     [
                        //         {
                        //             type: ActionTypes.MessageBack,
                        //             title: 'Update Card',
                        //             value: value,
                        //             text: 'UpdateCardAction'
                        //         },
                        //         {
                        //             type: ActionTypes.MessageBack,
                        //             title: 'Message all members',
                        //             value: null,
                        //             text: 'MessageAllMembers'
                        //         }]);
                        // await context.sendActivity({ attachments: [card] });
                        await context.sendActivity(`Your team is now ready to receive messages from CodeStream.`);
                        break;
                }
            }
            await next();
        });

        // this.onMembersAddedActivity(async (context, next) => {
        //     context.activity.membersAdded.forEach(async (teamMember) => {
        //         if (teamMember.id !== context.activity.recipient.id) {
        //             await context.sendActivity(`Welcome to the team ${teamMember.givenName} ${teamMember.surname}`);
        //         }
        //     });
        //     await next();
        // });
    }

    attachHandler (handler) {
        this.databaseAdapter = handler;
    }

    async process () {

        return await this.databaseAdapter.process();
    }



    /* modal start */

    handleTeamsTaskModuleFetch (context, taskModuleRequest) {
        // taskModuleRequest.data can be checked to determine different paths.

        return {
            task: {
                type: 'continue',
                value: {
                    card: this.getTaskModuleAdaptiveCard(taskModuleRequest),
                    //  height: 400,
                    // width: 600,
                    title: 'Post a Reply'
                }
            }
        };
    }

    async handleTeamsTaskModuleSubmit (context, taskModuleRequest) {
        // dataAdapater.handleSubmit(context);

        // Hello. You said: ' + taskModuleRequest.data.usertext
        return {
            task: {
                // This could also be of type 'continue' with a new Task Module and card.
                type: 'message',
                value: 'Reply posted to CodeSteam!'
            }
        };
    }

    getTaskModuleAdaptiveCard (taskModuleRequest) {
        const codemark = taskModuleRequest.data.data.codemark;
        return CardFactory.adaptiveCard({
            version: '1.0.0',
            type: 'AdaptiveCard',
            body: [
                {
                    "type": "Container",
                    "items": [
                        {
                            "type": "ColumnSet",
                            "columns": [
                                {
                                    "type": "Column",
                                    "width": "auto",
                                    "items": [
                                        {
                                            "size": "small",
                                            "style": "person",
                                            "type": "Image",
                                            "url": "https://www.gravatar.com/avatar/f7260737d0f0098738ec7e788ec4bfe5"
                                        }
                                    ]
                                },
                                {
                                    "type": "Column",
                                    "width": "stretch",
                                    "items": [
                                        {
                                            "type": "TextBlock",
                                            "text": "Matt Hidinger",
                                            "weight": "bolder",
                                            "wrap": true
                                        },
                                        {
                                            "type": "TextBlock",
                                            "spacing": "none",
                                            "text": "Created {{DATE(2017-02-14T06:08:39Z, SHORT)}}",
                                            "isSubtle": true,
                                            "wrap": true
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    type: 'TextBlock',
                    text: codemark.text || codemark.title
                },
                {
                    type: 'Input.Text',
                    id: 'usertext',
                    placeholder: 'Compose a reply',
                    IsMultiline: true
                },
                {
                    type: 'TextBlock',
                    text: 'reply 2'
                },
                {
                    type: 'TextBlock',
                    text: 'reply 1',
                    separator: true
                },
            ],
            actions: [
                {
                    type: 'Action.Submit',
                    title: 'Submit',
                    data: {
                        codemark: codemark
                    }
                }
            ]
        });
    }


    /* modal end */


    async connect (activity, teamDetails, teamChannels, tenantId) {
        console.log('adding conversation reference...');
        const conversationReference = TurnContext.getConversationReference(activity);

        await this.databaseAdapter.merge({
            conversation: conversationReference,
            team: teamDetails,
            tenantId: tenantId,
            teamChannels: teamChannels
        });
    }

    // async mentionActivityAsync (context) {
    //     const mention = {
    //         mentioned: context.activity.from,
    //         text: `<at>${new TextEncoder().encode(context.activity.from.name)}</at>`,
    //         type: 'mention'
    //     };

    //     const replyActivity = MessageFactory.text(`Hi ${mention.text}`);
    //     replyActivity.entities = [mention];
    //     await context.sendActivity(replyActivity);
    // }

    // async updateCardActivityAsync (context) {
    //     const data = context.activity.value;
    //     data.count += 1;

    //     const card = CardFactory.heroCard(
    //         'Welcome Card',
    //         `Updated count - ${data.count}`,
    //         null,
    //         [
    //             {
    //                 type: ActionTypes.MessageBack,
    //                 title: 'Update Card',
    //                 value: data,
    //                 text: 'UpdateCardAction'
    //             },
    //             {
    //                 type: ActionTypes.MessageBack,
    //                 title: 'Message all members',
    //                 value: null,
    //                 text: 'MessageAllMembers'
    //             },
    //             {
    //                 type: ActionTypes.MessageBack,
    //                 title: 'Delete card',
    //                 value: null,
    //                 text: 'Delete'
    //             }
    //         ]);

    //     card.id = context.activity.replyToId;
    //     await context.updateActivity({ attachments: [card], id: context.activity.replyToId, type: 'message' });
    // }

    // async deleteCardActivityAsync (context) {
    //     await context.deleteActivity(context.activity.replyToId);
    // }  

    async disconnect (context) {
        const result = await this.databaseAdapter.disconnect({
            tenantId: context.activity.channelData.tenant.id
        });
        if (result) {
            await context.sendActivity(MessageFactory.text('CodeStream has been disconnected.'));
        }
        else {
            await context.sendActivity(MessageFactory.text('Oops, we had a problem disconnecting CodeStream. Please try again.'));
        }
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
            const card = CardFactory.heroCard('', "Sign in to CodeStream to get started!", null,
                [
                    {
                        type: ActionTypes.OpenUrl,
                        title: 'Sign in',
                        value: 'https://slayer.codestream.us:12079/web/login?tenantId=' + context.activity.channelData.tenant.id
                    }
                ]);

            // const card = CardFactory.adaptiveCard({
            //     version: '1.0.0',
            //     type: 'AdaptiveCard',   
            //     body: [ 

            //         {
            //             type: 'TextBlock',
            //             text: "a"
            //         },

            //         {
            //             type: ActionTypes.OpenUrl,
            //             title: 'Sign in',
            //             value: 'https://slayer.codestream.us:12079/web/login?tenantId=' + context.activity.channelData.tenant.id
            //         }
            //     ]
            // });

            // const card = CardFactory.heroCard(
            //     'CodeStream',
            //     `cheese`,
            //     null,
            //     [
            //         {
            //             type: ActionTypes.OpenUrl,
            //             title: 'Sign in',
            //             value: 'https://slayer.codestream.us:12079/web/login?tenantId=' + context.activity.channelData.tenant.id
            //         },
            //     ]);

            await context.sendActivity({
                attachments: [card]
            });
            await context.sendActivity(MessageFactory.text('After signing in, please copy the code you received in your authentication screen and paste it here.'))
        }
    }

    async helpAsync (context) {
        await context.sendActivity(MessageFactory.text('this is help text'));
    }

    // If you encounter permission-related errors when sending this message, see
    // https://aka.ms/BotTrustServiceUrl
    async messageAllMembersAsync (context) {
        const members = await TeamsInfo.getMembers(context);


        members.forEach(async (teamMember) => {
            const message = MessageFactory.text(`Hello ${teamMember.givenName} ${teamMember.surname}. I'm a Teams conversation bot.`);

            var ref = TurnContext.getConversationReference(context.activity);
            ref.user = teamMember;

            await context.adapter.createConversation(ref,
                async (t1) => {
                    const ref2 = TurnContext.getConversationReference(t1.activity);
                    await t1.adapter.continueConversation(ref2, async (t2) => {
                        await t2.sendActivity(message);
                    });
                });
        });

        await context.sendActivity(MessageFactory.text('All messages have been sent.'));
    }


}

module.exports = MSTeamsConversationBot;
