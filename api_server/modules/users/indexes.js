// these database indexes are in place for the users module, all fetch queries
// must use one of these

'use strict';

module.exports = {
	byId: {
		_id: 1
	},
	byTeamIds: {
		teamIds: 1
	},
	bySearchableEmail: {
		searchableEmail: 1
	},
	byProviderIdentities: {
		providerIdentities: 1
	},
	byExternalUserId: {
		externalUserId: 1
	},
	byNeedsAutoReinvites: {
		needsAutoReinvites: 1
	}
};
