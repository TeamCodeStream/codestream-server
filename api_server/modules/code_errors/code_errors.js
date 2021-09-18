// provide a module to handle requests associated with code errors

'use strict';

const Restful = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful');
const CodeErrorCreator = require('./code_error_creator');
const CodeErrorUpdater = require('./code_error_updater');

const CodeError = require('./code_error');

// expose these restful routes
const CODE_ERROR_STANDARD_ROUTES = {
	want: ['get', 'getMany', 'put', 'delete'],
	baseRouteName: 'code-errors',
	requestClasses: {
		'get': require('./get_code_error_request'),
		'getMany': require('./get_code_errors_request'),
		'put': require('./put_code_error_request'),
		'delete': require('./delete_code_error_request')
	}
};

// additional routes for this module
const CODE_ERROR_ADDITIONAL_ROUTES = [
	{
		method: 'put',
		path: 'code-errors/follow/:id',
		requestClass: require('./follow_code_error_request')
	},
	{
		method: 'put',
		path: 'code-errors/unfollow/:id',
		requestClass: require('./unfollow_code_error_request')
	},
	{
		method: 'get',
		path: 'no-auth/unfollow-link/code-error/:id',
		requestClass: require('./unfollow_code_error_link_request')
	}
];

class CodeErrors extends Restful {

	get collectionName () {
		return 'codeErrors';	// name of the data collection
	}

	get modelName () {
		return 'codeError';	// name of the data model
	}

	get creatorClass () {
		return CodeErrorCreator;	// use this class to instantiate code errors
	}

	get modelClass () {
		return CodeError;	// use this class for the data model
	}

	get modelDescription () {
		return 'A single code error';
	}

	get updaterClass () {
		return CodeErrorUpdater;
	}

	// get all routes exposed by this module
	getRoutes () {
		let standardRoutes = super.getRoutes(CODE_ERROR_STANDARD_ROUTES);
		return [...standardRoutes, ...CODE_ERROR_ADDITIONAL_ROUTES];
	}
}

module.exports = CodeErrors;
