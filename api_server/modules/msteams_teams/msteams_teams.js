// provide a module to handle requests associated with users

'use strict';

const Restful = require(process.env.CS_API_TOP + '/lib/util/restful/restful');
const Errors = require('./errors');

class MSTeamsTeams extends Restful {

	get collectionName () {
		return 'msteams_teams';
	}

	get modelName () {
		return 'msteams_team';
	}

	get creatorClass () {
		return null;
	}

	get modelClass () {
		return null;
	}

	get modelDescription () {
		return 'A single msteams team';
	}

	get updaterClass () {
		return null;
	}

	get deleterClass () {
		return null;
	}
	
	getRoutes () {         
		return undefined;
	}

	initialize () {		
	}

	describeErrors () {
		return {
			'MSTeamsTeams': Errors
		};
	}
}

module.exports = MSTeamsTeams;
