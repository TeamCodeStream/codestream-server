// provide a module to handle requests associated with teams

'use strict';

var Restful = require(process.env.CS_API_TOP + '/lib/util/restful/restful');
var TeamCreator = require('./team_creator');
//var TeamUpdater = require('./team_updater');
var Team = require('./team');

// expose these restful routes
const TEAM_STANDARD_ROUTES = {
	want: ['get', 'getMany'],
	baseRouteName: 'teams',
	requestClasses: {
		'getMany': require('./get_teams_request')
	}
};

class Teams extends Restful {

	get collectionName () {
		return 'teams';	// name of the data collection
	}

	get modelName () {
		return 'team';	// name of the data model
	}

	get creatorClass () {
		return TeamCreator;	// use this class to instantiate teams
	}

	get modelClass () {
		return Team;	// use this class for the data model
	}

/*
	get updaterClass () {
		return TeamUpdater;	// use this class to update teams (not supported yet)
	}
*/

	getRoutes () {
		return super.getRoutes(TEAM_STANDARD_ROUTES);
	}
}

module.exports = Teams;
