// these database indexes are in place for the users module, all fetch queries
// must use one of these

'use strict';

module.exports = {
	byTeamId: {
		teamId: 1		
	},
	byTenantId: {
		tenantId: 1		
	}
};
