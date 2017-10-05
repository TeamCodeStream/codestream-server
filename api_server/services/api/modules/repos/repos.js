'use strict';

var Restful = require(process.env.CI_API_TOP + '/lib/util/restful/restful');
var Repo_Creator = require('./repo_creator');
//var Repo_Updater = require('./repo_updater');
var Repo = require('./repo');

const REPO_STANDARD_ROUTES = {
	want: ['get', 'get_many', 'post'],
	base_route_name: 'repos',
	request_classes: {
		'get_many': require('./get_repos_request')
	}
};

class Repos extends Restful {

	get collection_name () {
		return 'repos';
	}

	get model_name () {
		return 'repo';
	}

	get creator_class () {
		return Repo_Creator;
	}

	get model_class () {
		return Repo;
	}

/*
	get updater_class () {
		return Repo_Updater;
	}
*/

	get_routes () {
		return super.get_routes(REPO_STANDARD_ROUTES);
	}
}

module.exports = Repos;
