// these database indexes are in place for the companies module, all fetch queries
// must use one of these

'use strict';

module.exports = {
	byDomainJoining: {
		domainJoining: 1
	},
	byNRAccountId: {
		nrAccountIds: 1
	},
	byNROrgId: {
		nrOrgIds: 1
	}
};
