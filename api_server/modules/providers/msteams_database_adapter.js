// This is the bridge between an ms teams bot and the CodeStream backend
// They both roughly have the same method surface.
// This class should be instantiated for each request that the ms teams bot handles

'use strict';

/*eslint complexity: ["error", 666]*/

const SignupTokens = require(process.env.CS_API_TOP + '/modules/users/signup_tokens');
const TeamIndexes = require(process.env.CS_API_TOP + '/modules/teams/indexes');
const MSTeamsTeamsIndexes = require(process.env.CS_API_TOP + '/modules/msteams_teams/indexes');
const MSTeamsConversationIndexes = require(process.env.CS_API_TOP + '/modules/msteams_conversations/indexes');
const ModelSaver = require(process.env.CS_API_TOP + '/lib/util/restful/model_saver');
const UserIndexes = require(process.env.CS_API_TOP + '/modules/users/indexes');
const MSTeamsUtils = require(process.env.CS_API_TOP + '/modules/providers/msteams_utils');

class MSTeamsDatabaseAdapter {
	constructor (options) {
		Object.assign(this, options);
	}

	async process () {
		// eventually this will need to capture state for replies / telemetry
		return false;
	}

	async disconnect (conversationReference) {
		try {
			const conversationIdString = conversationReference.conversation.conversation.id.split(';');
			const conversationId = conversationIdString[0];
			this.api.log(`disconnecting tenantId=${conversationReference.tenantId} conversationId=${conversationId}...`);
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
				await this.data.msteams_conversations.deleteById(conversation.id);
				this.api.log(`tenantId=${conversationReference.tenantId} conversationId=${conversationId} deleted`);
				return true;
			}

			return true;
		}
		catch (ex) {
			this.api.log(ex);
			return false;
		}
	}

	async disconnectAll (data) {
		try {
			this.api.log(`disconnecting all channels for tenantId=${data.tenantId} msTeamId=${data.teamId}...`);
			const query = {
				tenantId: data.tenantId,
				msTeamsTeamId: data.teamId
			};
			const conversations = await this.data.msteams_conversations.getByQuery(
				query,
				{
					hint: MSTeamsConversationIndexes.byTenantIdMsTeamsTeamIds
				}
			);
			if (conversations && conversations.length) {
				await this.data.msteams_conversations.deleteByIds(conversations.map(_ => _.id));
				this.api.log(`${conversations.length} tenantId=${data.tenantId} msTeamsTeamId=${data.teamId} conversations deleted`);
				return true;
			}

			return true;
		}
		catch (ex) {
			this.api.log(ex);
			return false;
		}
	}

	async signout (data) {
		this.api.log(`signing out for tenantId=${data.tenantId}...`);
		// TODO not really much to do here		
		return true;
	}

	// compare the user's token with what is stored	
	async complete (data) {
		this.api.log(`completing the signin for tenantId=${data.tenantId}...`);
		try {
			const signupTokenService = new SignupTokens({ api: this.api });
			signupTokenService.initialize();

			const signupToken = await signupTokenService.find(data.token);
			if (signupToken && signupToken.token === data.token) {
				// allow all the teams that this user is part of to use MST
				// these are stored on the signup token when issued
				const teams = await this.data.teams.getByIds(signupToken.teamIds);
				for (const team of teams) {
					if (!team || team.get('deactivated')) return false;

					let op = {
						$set: {}
					};
					op.$set[`providerBotInfo.msteams.${data.tenantId}`] = {
						data: {
							connected: true
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
					}
					else {
						addToSet = true;
					}

					if (addToSet) {
						op.$addToSet = {
							providerIdentities: `msteams::${data.tenantId}`
						};
					}

					this.transforms.teamUpdate = await new ModelSaver({
						request: this.request,
						collection: this.data.teams,
						id: team.id
					}).save(op);
				}
				return true;
			}
			return false;
		}
		catch (ex) {
			this.api.log(ex);
		}
		return false;
	}

	async connect (conversationReference) {
		try {
			// the conversationId comes in as a two part string like...
			// 19:d2a0123443734813413414@thread.skype;messageid=184127312832193
			// the entire string will continue a conversation at a specific point (aka a reply)
			// in order to post to a "channel" we need the part of the string before the ;
			const conversationIdString = conversationReference.conversation.conversation.id.split(';');
			const messageId = conversationIdString[1] && conversationIdString[1].length ?
				conversationIdString[1].replace('messageid=', '') :
				undefined;
			const conversationId = conversationIdString[0];

			const tenantId = conversationReference.tenantId;
			this.api.log(`connecting tenantId=${tenantId} with conversationId=${conversationId}...`);

			const teams = await this.getTeamsByTenant(tenantId);
			if (!teams || !teams.length) {
				return {
					reason: 'signin',
					success: false
				};
			}

			this.transforms.userUpdates = [];

			const query = {
				conversationId: conversationId
			};
			const conversation = await this.data.msteams_conversations.getOneByQuery(
				query,
				{
					hint: MSTeamsConversationIndexes.byConversationIds,
					noCache: true,
					ignoreCache: true
				}
			);
			if (!conversation) {
				// only want to ever store 1 of these conversations (per tenant)
				let channelName = undefined;
				const teamChannel = conversationReference.teamChannels.find(_ => _.id == conversationId);

				if (teamChannel) {
					// the General channel does not come with a name
					channelName = teamChannel.name || 'General';
				}
				if (!channelName) {
					this.api.log(`Cannot go ahead with tenantId=${tenantId} conversationId=${conversationId}, there is no channel name`);
					return false;
				}

				let msTeamsTeam = await this.data.msteams_teams.getByQuery({
					msTeamsTeamId: conversationReference.team.id
				}, {
					hint: MSTeamsTeamsIndexes.byMSTeamsTeamId,
					noCache: true,
					ignoreCache: true
				});
				if (!msTeamsTeam || !msTeamsTeam.length) {
					await this.data.msteams_teams.create({
						// id of the ms teams team
						msTeamsTeamId: conversationReference.team.id,
						name: conversationReference.team.name,
						tenantId: conversationReference.tenantId
					});
				}
				// note, we are adjusting this object by only storing the "channel" part of the message
				// we will store the actual messageId just in case we ever need it
				conversationReference.conversation.conversation.id = conversationId;
				await this.data.msteams_conversations.create({
					// ms properties
					conversationId: conversationId,
					msTeamsTeamId: conversationReference.team.id,
					conversation: conversationReference.conversation,
					tenantId: conversationReference.tenantId,
					channelName: channelName,
					messageId: messageId
				});
			}

			for (const team of teams) {
				// if this team has been marked by a user issuing the `signin` command, exclude it
				const isConnected = this.isTeamConnected(team, tenantId);
				if (!isConnected) {
					this.api.log(`teamId=${team.id} is not connected`);
					continue;
				}

				this.api.log(`updating users for CS team=${team.id} to tenantId=${tenantId}`);
				this.updateUsers(team, conversationReference);
			}
			return {
				success: true
			};
		}
		catch (ex) {
			this.api.log(ex);
			return {
				success: false
			};
		}
	}

	async uninstall (conversationReference) {
		let tenantId;
		try {
			tenantId = conversationReference.tenantId;
			const teams = await this.getTeamsByTenant(tenantId);
			for (const team of teams) {
				if (team) {
					const providerIdentities = team.get('providerIdentities');

					if (providerIdentities) {
						const op = {
							$set: {
								modifiedAt: Date.now()
							},
							$pull: {
								providerIdentities: `msteams::${tenantId}`
							},
							$unset: {
								providerBotInfo: 'msteams'
							}
						};
						this.transforms.teamUpdate = await new ModelSaver({
							request: this.request,
							collection: this.data.teams,
							id: team.id
						}).save(op);
					}
				}
			}
		}
		catch (ex) {
			this.api.log(`uninstalling tenantId=${tenantId}...`, ex);
			return false;
		}
		return true;
	}

	async debug (conversationReference) {
		const tenantId = conversationReference.tenantId;
		this.api.log(`debugging tenantId=${tenantId}...`);

		let data = [];
		let error;
		try {
			const teams = await this.getTeamsByTenant(tenantId);
			const conversations = await this.data.msteams_conversations.getByQuery(
				{
					tenantId: tenantId
				},
				{
					hint: MSTeamsConversationIndexes.byTenantIds
				}
			);
			const conversationsCount = conversations.length;
			for (const team of teams) {
				if (team) {
					const isTeamConnected = await this.isTeamConnected(team, tenantId);
					data.push({
						csTeamId: team && team.id,
						name: team && team.get('name'),
						isTeamConnected: isTeamConnected,
						conversationsCount: conversationsCount,
					});
				}
			}
		}
		catch (ex) {
			this.api.log(`debugging for tenantId=${tenantId} failed...`, ex);
			error = ex.message;
		}
		return {
			data: data,
			error: error
		};
	}

	async status (data) {
		const tenantId = data.tenantId;
		let results = {};
		try {
			const teams = await this.getTeamsByTenant(tenantId);
			results.teams = teams;
		}
		catch (ex) {
			this.api.log(`status for tenantId=${tenantId} failed...`, ex);
			results.error = ex;
		}
		return results;
	}

	async getTeamsByTenant (tenantId) {
		const query = {
			providerIdentities: `msteams::${tenantId}`,
			deactivated: false
		};
		const teams = await this.data.teams.getByQuery(
			query,
			{ hint: TeamIndexes.byProviderIdentities }
		);

		return teams;
	}

	// returns whether this team has the msteams...data.connected property
	// set to true
	async isTeamConnected (team, tenantId) {
		return MSTeamsUtils.isTeamConnected(team, tenantId);
	}

	async updateUsers (team, conversationReference) {
		this.api.log(`updating users for teamId=${team.id}...`);
		const users = await this.data.users.getByQuery({
			teamIds: team.id,
			isRegistered: true,
			deactivated: false
		}, {
			hint: UserIndexes.byTeamIds
		}
		);

		for (const user of users) {
			const op = {
				$set: {}
			};
			// NOTE: these accessTokens can be anything that isn't empty
			// just the existence of these objects along with an msteams_conversation
			// is enough to post to their tenant/team
			let existingProviderInfo = ((user.get('providerInfo') || {})[team.id] || {})['msteams'] || {};
			if (existingProviderInfo && Object.keys(existingProviderInfo).length) {
				let providerInfoKey = `providerInfo.${team.id}.msteams`;
				op.$set[`${providerInfoKey}.multiple.${conversationReference.tenantId}`] = {
					...{
						accessToken: 'MSTEAMS'
					}, extra: {
						connected: true
					}
				};
			}
			else {
				op.$set[`providerInfo.${team.id}.msteams.multiple.${conversationReference.tenantId}`] = {
					...{
						accessToken: 'MSTEAMS'
					}, extra: {
						connected: true
					}
				};
			}

			op.$set.modifiedAt = Date.now();
			this.transforms.userUpdates.push(await new ModelSaver({
				request: this.request,
				collection: this.data.users,
				id: user.id
			}).save(op));
		}
	}
}
module.exports = MSTeamsDatabaseAdapter;
