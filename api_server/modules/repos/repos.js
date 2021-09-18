// provide a module to handle requests associated with repos

'use strict';

const Restful = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful');
const Repo = require('./repo');
const Errors = require('./errors');
const RepoCreator = require('./repo_creator');

// expose these restful routes
const REPOS_STANDARD_ROUTES = {
	want: ['get', 'getMany'],
	baseRouteName: 'repos',
	requestClasses: {
		'get': require('./get_repo_request'),
		'getMany': require('./get_repos_request')
	}
};

// expose additional routes
const REPOS_ADDITIONAL_ROUTES = [
	// NOTE: these repos/match requests differ only in that the PUT one will make changes 
	// to the existing repos (adding or updating as needed), while the GET will only
	// match and make no changes
	{
		method: 'put',
		path: 'repos/match/:teamId',
		requestClass: require('./match_repos_request')
	},
	{
		method: 'get',
		path: 'repos/match/:teamId',
		requestClass: require('./match_repos_request')
	},
	{
		method: 'get',
		path: 'no-auth/team-lookup',
		requestClass: require('./team_lookup_request')
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

	get modelDescription () {
		return 'A single repo, identified by normalized URL';
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

	describeErrors () {
		return {
			'Repos': Errors
		};
	}
}

module.exports = Repos;
