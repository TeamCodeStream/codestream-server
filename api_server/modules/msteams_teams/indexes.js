// these database indexes are in place for the msteams_teams module, all fetch queries
// must use one of these

'use strict';

module.exports = {
	// gets msteams_teams by the MS Teams teamId
	byMSTeamsTeamId: {
		msTeamsTeamId: 1		
	},
	// get all msteams_teams by the MS Teams tenantId (organization)
	// (when you want all teams for a tenant)
	byTenantId: {
		tenantId: 1		
	}
};
