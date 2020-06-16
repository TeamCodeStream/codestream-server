// provide a module to handle requests associated with "codemarks"

'use strict';

const Restful = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful');
const CodemarkCreator = require('./codemark_creator');
const CodemarkUpdater = require('./codemark_updater');

const Codemark = require('./codemark');

// expose these restful routes
const CODEMARK_STANDARD_ROUTES = {
	want: ['get', 'getMany', 'post', 'put', 'delete'],
	baseRouteName: 'codemarks',
	requestClasses: {
		'get': require('./get_codemark_request'),
		'getMany': require('./get_codemarks_request'),
		'post': require('./post_codemark_request'),
		'put': require('./put_codemark_request'),
		'delete': require('./delete_codemark_request')
	}
};

// additional routes for this module
const CODEMARK_ADDITIONAL_ROUTES = [
	{
		method: 'put',
		path: 'pin/:id',
		requestClass: require('./pin_request')
	},
	{
		method: 'put',
		path: 'unpin/:id',
		requestClass: require('./unpin_request')
	},
	{
		method: 'put',
		path: 'pin-post',
		requestClass: require('./pin_post_request')
	},
	{
		method: 'put',
		path: 'unpin-post',
		requestClass: require('./unpin_post_request')
	},
	{
		method: 'post',
		path: 'codemarks/:id/permalink',
		requestClass: require('./codemark_link_request')
	},
	{
		method: 'put',
		path: 'relate-codemark/:id1/:id2',
		requestClass: require('./relate_codemark_request')
	},
	{
		method: 'put',
		path: 'unrelate-codemark/:id1/:id2',
		requestClass: require('./unrelate_codemark_request')
	},
	{
		method: 'put',
		path: 'codemarks/:id/add-tag',
		requestClass: require('./add_tag_request')
	},
	{
		method: 'put',
		path: 'codemarks/:id/remove-tag',
		requestClass: require('./remove_tag_request')
	},
	{
		method: 'put',
		path: 'codemarks/follow/:id',
		requestClass: require('./follow_codemark_request')
	},
	{
		method: 'put',
		path: 'codemarks/unfollow/:id',
		requestClass: require('./unfollow_codemark_request')
	},
	{
		method: 'get',
		path: 'no-auth/unfollow-link/:id',
		requestClass: require('./unfollow_link_request')
	}
];

class Codemarks extends Restful {

	get collectionName () {
		return 'codemarks';	// name of the data collection
	}

	get modelName () {
		return 'codemark';	// name of the data model
	}

	get creatorClass () {
		return CodemarkCreator;	// use this class to instantiate codemarks
	}

	get modelClass () {
		return Codemark;	// use this class for the data model
	}

	get modelDescription () {
		return 'A single codemark, such as a question, issue, code trap, etc.';
	}

	get updaterClass () {
		return CodemarkUpdater;
	}

	// get all routes exposed by this module
	getRoutes () {
		let standardRoutes = super.getRoutes(CODEMARK_STANDARD_ROUTES);
		return [...standardRoutes, ...CODEMARK_ADDITIONAL_ROUTES];
	}
}

module.exports = Codemarks;
