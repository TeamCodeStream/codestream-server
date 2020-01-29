const SignupTokens = require(process.env.CS_API_TOP + '/modules/users/signup_tokens');
const TeamIndexes = require(process.env.CS_API_TOP + '/modules/teams/indexes');
const MSTeamsConversationIndexes = require(process.env.CS_API_TOP + '/modules/msteams_conversations/indexes');
const ModelSaver = require(process.env.CS_API_TOP + '/lib/util/restful/model_saver');
const UserIndexes = require(process.env.CS_API_TOP + '/modules/users/indexes');

class MSTeamsCallbackHandler {
	constructor (options) {
		Object.assign(this, options);
	}

	attachData (data) {
		this.data = data;
	}

	async getTeamByTenant (tenantId) {
		const query = {
			providerIdentities: `msteams::${tenantId}`,
			deactivated: false
		};
		const team = await this.data.teams.getOneByQuery(
			query,
			{ hint: TeamIndexes.byProviderIdentities }
		);
		return team;
	}

	async isTeamConnected (tenantId, team) {
		if (!team) {
			team = await this.getTeamByTenant(tenantId);
		}
		if (!team || team.get('deactivated')) return false;

		const providerIdentities = team.get('providerIdentities');
		if (!providerIdentities) return false;

		const msteam = providerIdentities.find(_ => _ === `msteams::${tenantId}`);
		if (!msteam) return false;

		const providerInfo = team.get('providerBotInfo');
		if (!providerInfo) return false;

		if (providerInfo.tenantId === tenantId &&
			providerInfo.data &&
			providerInfo.data.connected) {
			return true;
		}
		return false;
	}

	async process () {
		return false;
	}

	async disconnect (data) {
		// todo

		return true;
	}

	async signout (data) {
		// todo

		// console.log(`MSTeamsCallbackHandler disconnect`);
		// var bars = await this.data.bars.getByQuery({
		// 	tenantId: data.tenantId
		// }, {
		// 	overrideHintRequired: true,
		// 	noCache: true,
		// 	ignoreCache: true
		// }
		// )
		// if (!bars || !bars.length || bars.length !== 1) {
		// 	return false;
		// }

		// const bar = bars[0];
		// await this.data.bars.updateDirect(
		// 	{
		// 		id: this.data.bars.objectIdSafe(bar.id)
		// 	},
		// 	{
		// 		$set: {
		// 			connected: false,
		// 			token: undefined
		// 		}

		// 	});
		return true;
	}

	// compare the user's token with what is stored	
	async complete (data) {
		console.log(`MSTeamsCallbackHandler complete`);
		try {
			const signupTokenService = new SignupTokens({ api: this.api });
			signupTokenService.initialize();
			const signupToken = await signupTokenService.find(data.token);
			if (signupToken && signupToken.token === data.token) {
				const team = await this.data.teams.getById(signupToken.teamId);
				if (!team || team.get('deactivated')) {
					return {
						success: false
					}
				}

				let op = {
					$set: {
						'providerBotInfo.msteams': {
							tenantId: data.tenantId,
							data: {
								connected: true
							}
						}
					}
				};

				const providerIdentities = team.get('providerIdentities');
				let addToSet = false;
				if (providerIdentities) {
					// we have providerIdentities but not this one...
					const msteam = providerIdentities.find(_ => _ === `msteams::${data.tenantId}`);
					if (!msteam) {
						addToSet = true;
					}
					else {
						// exists
					}
				}
				else {
					addToSet = true;
				}

				if (addToSet) {
					// opposite is $pull
					op.$addToSet = {
						providerIdentities: `msteams::${data.tenantId}`
					}
				}

				this.transforms.teamUpdate = await new ModelSaver({
					request: this,
					collection: this.data.teams,
					id: team.id
				}).save(op);

				// const op2 = {
				// 	$set: {}
				// };

				// const user = await this.data.users.getById(signupToken.userId);

				// let existingProviderInfo = ((user.get('providerInfo') || {})[team.id] || {})['msteams'] || {};
				// let providerInfoKey = `providerInfo.${team.id}.msteams`;
				// op2.$set[`${providerInfoKey}.multiple.${data.tenantId}`] = {
				// 	...{
				// 		accessToken: "a"
				// 	}, extra: {
				// 		cheese: true
				// 	}
				// };
				// op2.$set.modifiedAt = Date.now();

				// this.transforms.userUpdate = await new ModelSaver({
				// 	request: this,
				// 	collection: this.data.users,
				// 	id: user.id
				// }).save(op2);

				// const identity = `msteams::${data.tenantId}`;
				// if (!(user.get('providerIdentities') || []).find(id => id === identity)) {

				// }


				//this.cheese = op;
				return {
					success: true
				}

			}
			return {
				success: false
			}


			// TODO example code to nuke

			// 	await this.data.bars.updateById(bar.id, {						 
			// 			connected: true
			// 		})

			// 		await this.data.bars.applyOpById(bar.id, {
			// 			$set: {
			// 				connected: true							
			// 			},
			// 			$unset: {							
			// 				token: true
			// 			}
			// 		})

			// 	*/
			// 	await this.data.bars.updateDirect(
			// 		{
			// 			id: this.data.bars.objectIdSafe(bar.id)
			// 		},
			// 		{
			// 			$set: {
			// 				connected: true,
			// 				token: undefined
			// 			}

			// 		});
			// 	await this.data.persist();
			// 	return true;
			// }
		}
		catch (ex) {
			console.log(ex);
		}
		return false;
	}

	async merge (conversationReference) {
		// todo this needs cleanup
		try {
			console.log(`MSTeamsCallbackHandler merge`);
			const team = await this.getTeamByTenant(conversationReference.tenantId);
			const isConnected = await this.isTeamConnected(conversationReference.tenantId, team)
			if (isConnected) {
				console.log(`tenantId=${conversationReference.tenantId} is not connected`);
				return false;
			}
			// the conversationId comes in as a two part string like...
			// 19:d2a0123443734813413414@thread.skype;messageid=184127312832193
			// the entire string will continue a conversation at a specific point (aka a reply)
			// in order to post to a "channel" we need the part of the string before the ;
			const conversationIdString = conversationReference.conversation.conversation.id.split(';');
			const messageId = conversationIdString[1] && conversationIdString[1].length ?
				conversationIdString[1].replace('messageid=', '') :
				undefined;
			const conversationId = conversationIdString[0];
			const query = {
				conversationId: conversationId
			};
			const conversation = await this.data.msteams_conversations.getOneByQuery(
				query,
				{
					hint: MSTeamsConversationIndexes.byConversationIds
				}
			);
			if (conversation) {
				console.log(`tenantId=${conversationReference.tenantId} conversationId=${conversationId} already stored`);
				return false;
			}

			let channelName = undefined;
			const teamChannel = conversationReference.teamChannels.find(_ => _.id == conversationId);

			if (teamChannel) {
				// the General channel does not come with a name
				channelName = teamChannel.name || 'General';
			}
			if (!channelName) {
				console.log('cannot merge, no channel name');
				return false;
			}

			// note, we are adjusting this object by only storing the "channel" part of the message
			// we will store the actual messageId just in case we ever need it
			conversationReference.conversation.conversation.id = conversationId;
			await this.data.msteams_conversations.create({
				// this is the CodeStream teamId
				teamId: team.id,
				// ms properties
				conversationId: conversationId,
				msTeamsTeamId: conversationReference.team.id,
				conversation: conversationReference.conversation,
				tenantId: conversationReference.tenantId,
				teamName: conversationReference.team.name,
				channelName: channelName,
				messageId: messageId
			});

			const users = await this.data.users.getByQuery({
				teamIds: [team.id],
				isRegistered: true,
				deactivated: false
			}, { hint: UserIndexes.byTeamIds }
			);
			this.transforms.userUpdates = [];
			for (const user of users) {
				const op2 = {
					$set: {}
				};
				let existingProviderInfo = ((user.get('providerInfo') || {})[team.id] || {})['msteams'] || {};
				if (existingProviderInfo && Object.keys(existingProviderInfo).length) {
					let providerInfoKey = `providerInfo.${team.id}.msteams`;
					op2.$set[`${providerInfoKey}.multiple.${conversationReference.tenantId}`] = {
						...{
							accessToken: "yush"
						}, extra: {
							cheese: true
						}
					};
				}
				else {
					if (!user.get('providerInfo')) {
						op2.$set.providerInfo = {}
						op2.$set.providerInfo[team.id] = {};
						op2.$set.providerInfo[team.id].msteams = {};
						op2.$set.providerInfo[team.id].msteams.multiple = {};
						op2.$set.providerInfo[team.id].msteams.multiple[conversationReference.tenantId] = {
							...{
								accessToken: "yush"
							}, extra: {
								cheese: true
							}
						};
					}
				}

				op2.$set.modifiedAt = Date.now();

				this.transforms.userUpdates.push(await new ModelSaver({
					request: this,
					collection: this.data.users,
					id: user.id
				}).save(op2));
			}
		}
		catch (ex) {
			console.log(ex);
		}
	}
}
module.exports = MSTeamsCallbackHandler;
