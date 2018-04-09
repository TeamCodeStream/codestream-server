// these database indexes are in place for the repos module, all fetch queries
// must use one of these

'use strict';

module.exports = {
	byNormalizedUrl: {
		normalizedUrl: 1
	},
	byTeamId: {
		teamId: 1
	},
	byCompanyIdentifier: {
		companyIdentifier: 1
	}
};
