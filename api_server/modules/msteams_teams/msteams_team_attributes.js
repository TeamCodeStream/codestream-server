// attributes for msteams_team documents/models

'use strict';

module.exports = {	
	msTeamsTeamId:{
		type: 'string',
		maxLength: 100,
		description: 'the id for this MS Teams team'
	}, 
	teamName: {
		type: 'string',
		maxLength: 100,
		description: 'The name of the MS Teams team'
	},		
	tenantId: {
		type: 'string',
		maxLength: 100,
		description: 'The id of the MS tenant'
	}
};
