'use strict';

var Restful = require(process.env.CS_API_TOP + '/lib/util/restful/restful');
var RepoCreator = require('./repo_creator');
//var RepoUpdater = require('./repo_updater');
var Repo = require('./repo');

const REPO_STANDARD_ROUTES = {
	want: ['get', 'getMany', 'post'],
	baseRouteName: 'repos',
	requestClasses: {
		'getMany': require('./get_repos_request'),
		'post': require('./post_repo_request')
	}
};

class Repos extends Restful {

	get collectionName () {
		return 'repos';
	}

	get modelName () {
		return 'repo';
	}

	get creatorClass () {
		return RepoCreator;
	}

	get modelClass () {
		return Repo;
	}

/*
	get updaterClass () {
		return RepoUpdater;
	}
*/

	getRoutes () {
		return super.getRoutes(REPO_STANDARD_ROUTES);
	}
}

module.exports = Repos;
