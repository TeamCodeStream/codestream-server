// these database indexes are in place for the teams module, all fetch queries
// must use one of these

'use strict';

module.exports = {
	byProviderIdentities: {
		providerIdentities: 1
	},
	byPlan: { // this index is deprecated in favor of companies collection
		plan: 1,
		deactivated: 1
	},
	byLastPostCreatedAt: {
		lastPostCreatedAt: 1
	}
};
