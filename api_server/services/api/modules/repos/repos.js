'use strict';

var Restful = require(process.env.CS_API_TOP + '/lib/util/restful/restful');
var RepoCreator = require('./repo_creator');
//var RepoUpdater = require('./repo_updater');
var Repo = require('./repo');

const REPOS_STANDARD_ROUTES = {
	want: ['get', 'getMany', 'post'],
	baseRouteName: 'repos',
	requestClasses: {
		'getMany': require('./get_repos_request'),
		'post': require('./post_repo_request')
	}
};

const REPOS_ADDITIONAL_ROUTES = [
	{
		method: 'get',
		path: 'no-auth/find-repo',
		requestClass: require('./find_repo_request')
	}
];


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
		let standardRoutes = super.getRoutes(REPOS_STANDARD_ROUTES);
		return [...standardRoutes, ...REPOS_ADDITIONAL_ROUTES];
	}
}

module.exports = Repos;
