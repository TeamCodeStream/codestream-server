// handle the "GET /msteams_conversations" request to fetch several ms teams conversations
// that were stored by the MS Teams bot in mongo

'use strict';

const GetManyRequest = require(process.env.CS_API_TOP + '/lib/util/restful/get_many_request');
const MSTeamsTeamsIndexes = require(process.env.CS_API_TOP + '/modules/msteams_teams/indexes');
const Indexes = require('./indexes');

class GetMSTeamsConversationsRequest extends GetManyRequest {

	async authorize () {
		// members of the same team can fetch each other
		await this.user.authorizeFromTeamId(this.request.query, this);
	}

	async preQueryHook () {
		this.teamId = decodeURIComponent(this.request.query.teamId || '');
		const tenantId = decodeURIComponent(this.request.query.tenantId || '');

		if (!this.teamId) {
			return this.errorHandler.error('parameterRequired', { info: 'teamId' });
		}
		// tenantId is the id that MS assigns the entire organization 
		// (where an organization is a collection of teams)
		if (!tenantId) {
			return this.errorHandler.error('parameterRequired', { info: 'tenantId' });
		}

		const team = await this.data.teams.getById(this.teamId);
		this.tenantId = this.isConnected(team, tenantId);
	}

	buildQuery () {
		// if we don't have a tenantId based on this team, then we aren't connected -- kick out
		if (!this.tenantId) return null;

		const query = {
			teamId: this.teamId.toLowerCase(),
			tenantId: this.tenantId
		};
		return query;
	}

	async postFetchHook () {
		// we need to mixin the name of the team to each of the conversations	
		const msTeamsTeams = await this.data.msteams_teams.getByQuery({ tenantId: this.tenantId }, {
			hint: MSTeamsTeamsIndexes.byTenantId
		});
		// convert to hash for lookup
		const idHash = msTeamsTeams.reduce(function (map, msTeamsTeam) {
			map[msTeamsTeam.get('msTeamsTeamId')] = msTeamsTeam;
			return map;
		}, {});
		for (const model of this.models) {
			const team = idHash[model.get('msTeamsTeamId')];
			if (!team) continue;

			model.attributes.teamName = team.get('name');
		}
	}

	getQueryOptions () {
		// provide appropriate index, by teamId & tenantId
		return {
			hint: Indexes.byTeamIdTenantIds
		};
	}

	// is this CS team and MS tenant connected?
	isConnected (team, tenantId) {
		if (!team || team.get('deactivated')) return undefined;

		const providerIdentities = team.get('providerIdentities');
		if (!providerIdentities) return undefined;

		const msteam = providerIdentities.find(_ => _ === `msteams::${tenantId}`);
		if (!msteam) return undefined;

		const providerInfo = team.get('providerBotInfo');
		if (!providerInfo) return undefined;

		if (providerInfo.msteams &&
			providerInfo.msteams.tenantId &&
			providerInfo.msteams.data &&
			providerInfo.msteams.data.connected) {
			// we need to make sure it's connected before returning the tenantId
			return providerInfo.msteams.tenantId;
		}
		return undefined;
	}

	// describe this route for help
	static describe (module) {
		const description = GetManyRequest.describe(module);
		description.access = 'User must be a member of the team for which MS Teams teams/conversations are being fetched';
		description.description = 'Fetch the MS Teams teams/conversations for a CodeStream team',
		Object.assign(description.input.looksLike, {
			'teamId*': '<ID of the CodeStream team for which MS Teams teams/conversations are being fetched>',
			'tenantId*': '<ID of the MS Teams tenant (organization)>'
		});

		return description;
	}
}

module.exports = GetMSTeamsConversationsRequest;
