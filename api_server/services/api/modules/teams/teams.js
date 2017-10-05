'use strict';

var Restful = require(process.env.CI_API_TOP + '/lib/util/restful/restful');
var Team_Creator = require('./team_creator');
//var Team_Updater = require('./team_updater');
var Team = require('./team');

const TEAM_STANDARD_ROUTES = {
	want: ['get', 'get_many', 'post'],
	base_route_name: 'teams',
	request_classes: {
		'get_many': require('./get_teams_request')
	}
};

const TEAM_ADDITIONAL_ROUTES = [
	{
		method: 'get',
		path: 'teams/:id',
		request_class: require('./get_teams_request')
	}
];

class Teams extends Restful {

	get collection_name () {
		return 'teams';
	}

	get model_name () {
		return 'team';
	}

	get creator_class () {
		return Team_Creator;
	}

	get model_class () {
		return Team;
	}

/*
	get updater_class () {
		return Team_Updater;
	}
*/

	get_routes () {
		var standard_routes = super.get_routes(TEAM_STANDARD_ROUTES);
		return [...standard_routes, ...TEAM_ADDITIONAL_ROUTES];
	}
}

module.exports = Teams;
