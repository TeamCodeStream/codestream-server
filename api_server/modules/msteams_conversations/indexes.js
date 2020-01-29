// these database indexes are in place for the users module, all fetch queries
// must use one of these

'use strict';

module.exports = {
	byConversationIds: {
		conversationId: 1
	},
	byTeamIdTenantIds: {
		teamId: 1,
		tenantId: 1
	}
};
