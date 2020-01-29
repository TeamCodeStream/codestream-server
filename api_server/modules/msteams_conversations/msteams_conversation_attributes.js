// attributes for user documents/models

'use strict';

module.exports = {	
	teamName: {
		type: 'string',
		maxLength: 100,
		description: 'The name of the MS Teams team'
	},
	channelName: {
		type: 'string',
		maxLength: 100,
		description: 'The name of an MS Teams team channel'
	},
	teamId: {
		type: 'string',
		maxLength: 100,
		description: 'teamId'
	},
	conversationId: {
		type: 'string',
		maxLength: 100,
		description: 'The id of an MS Teams conversation'
	},
	tenantId: {
		type: 'string',
		maxLength: 100,
		description: 'The id of the MS tenant'
	},
	msTeamsTeamId:{
		type: 'string',
		maxLength: 100,
		description: 'the id for this MS Teams team'
	}, 
	conversation: {
		type: 'object',
		description: 'A reference to an MS Teams conversation',
		serverOnly: true,
	}
};
