// provide a module to handle requests associated with repos

'use strict';

const Restful = require(process.env.CS_API_TOP + '/lib/util/restful/restful');
const RepoCreator = require('./repo_creator');
//const RepoUpdater = require('./repo_updater');
const Repo = require('./repo');

// expose these restful routes
const REPOS_STANDARD_ROUTES = {
	want: ['get', 'getMany', 'post'],
	baseRouteName: 'repos',
	requestClasses: {
		'getMany': require('./get_repos_request'),
		'post': require('./post_repo_request')
	}
};

// expose additional routes
const REPOS_ADDITIONAL_ROUTES = [
	{
		method: 'get',
		path: 'no-auth/find-repo',
		requestClass: require('./find_repo_request')
	},
	{
		method: 'get',
		path: 'no-auth/match-repo',
		requestClass: require('./match_repo_request')
	}
];

class Repos extends Restful {

	get collectionName () {
		return 'repos';	// name of the data collection
	}

	get modelName () {
		return 'repo';	// name of the data model
	}

	get creatorClass () {
		return RepoCreator;	// use this class to instantiate repos
	}

	get modelClass () {
		return Repo;	// use this class for the data model
	}

	/*
	get updaterClass () {
		return RepoUpdater;	// use this class to update repos
	}
	*/

	// compile all the routes to expose
	getRoutes () {
		let standardRoutes = super.getRoutes(REPOS_STANDARD_ROUTES);
		return [...standardRoutes, ...REPOS_ADDITIONAL_ROUTES];
	}
}

module.exports = Repos;
