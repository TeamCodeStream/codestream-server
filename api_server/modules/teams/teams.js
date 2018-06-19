// provide a module to handle requests associated with teams

'use strict';

const Restful = require(process.env.CS_API_TOP + '/lib/util/restful/restful');
const TeamCreator = require('./team_creator');
//const TeamUpdater = require('./team_updater');
const Team = require('./team');
const Errors = require('./errors');

// expose these restful routes
const TEAM_STANDARD_ROUTES = {
	want: ['get', 'getMany', 'post'/*, 'put', 'delete'*/],
	baseRouteName: 'teams',
	requestClasses: {
		'get': require('./get_team_request'),
		'getMany': require('./get_teams_request'),
		'post': require('./post_team_request')
	}
};

// expose additional routes
const TEAM_ADDITIONAL_ROUTES = [
	{
		method: 'put',
		path: '/delete-content',
		requestClass: require('./delete_content_request')
	}
];

class Teams extends Restful {

	get collectionName () {
		return 'teams';	// name of the data collection
	}

	get modelName () {
		return 'team';	// name of the data model
	}

	get modelDescription () {
		return 'A single team of users';
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

	// compile all the routes to expose
	getRoutes () {
		let standardRoutes = super.getRoutes(TEAM_STANDARD_ROUTES);
		return [...standardRoutes, ...TEAM_ADDITIONAL_ROUTES];
	}

	describeErrors () {
		return {
			'Teams': Errors
		};
	}
}

module.exports = Teams;
