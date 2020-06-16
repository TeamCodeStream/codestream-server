class MSTeamsUtils {
	static isTeamConnected (team, tenantId) {
		if (!team || team.get('deactivated')) return undefined;

		const providerIdentities = team.get('providerIdentities');
		if (!providerIdentities) return undefined;

		const msteam = providerIdentities.find(_ => _ === `msteams::${tenantId}`);
		if (!msteam) return undefined;

		const providerInfo = team.get('providerBotInfo');
		if (!providerInfo) return undefined;

		const msteams = providerInfo.msteams;
		if (!msteams) return undefined;

		const thisTenant = msteams[tenantId];
		if (!thisTenant) return undefined;
		
		if (thisTenant.data && thisTenant.data.connected) {
			// we need to make sure it's connected before returning the tenantId
			return tenantId;
		}
		return undefined;
	}
}

module.exports = MSTeamsUtils;
