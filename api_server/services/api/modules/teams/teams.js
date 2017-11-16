'use strict';

var Restful = require(process.env.CS_API_TOP + '/lib/util/restful/restful');
var TeamCreator = require('./team_creator');
//var TeamUpdater = require('./team_updater');
var Team = require('./team');

const TEAM_STANDARD_ROUTES = {
	want: ['get', 'getMany'],
	baseRouteName: 'teams',
	requestClasses: {
		'getMany': require('./get_teams_request')
	}
};

class Teams extends Restful {

	get collectionName () {
		return 'teams';
	}

	get modelName () {
		return 'team';
	}

	get creatorClass () {
		return TeamCreator;
	}

	get modelClass () {
		return Team;
	}

/*
	get updaterClass () {
		return TeamUpdater;
	}
*/

	getRoutes () {
		return super.getRoutes(TEAM_STANDARD_ROUTES);
	}
}

module.exports = Teams;
