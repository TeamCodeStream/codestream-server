// these database indexes are in place for the msteams_conversations module, all fetch queries
// must use one of these

'use strict';

module.exports = {
	// conversationId is the main way of looking up a stored conversation
	// it is not the mongo _id, but rather an id created by MS to represent a set of conversation properties
	byConversationIds: {
		conversationId: 1
	},
	byTenantIds: {
		tenantId: 1
	},
	// lookup based on the MS Teams tenantId (organization) AND the MS Teams teamId
	// you can have multiple teams under a single MS tenant	
	byTenantIdMsTeamsTeamIds: {		
		tenantId: 1,
		msTeamsTeamId: 1
	}
};
