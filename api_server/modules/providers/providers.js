// provide a module to handle requests associated with third-party providers

'use strict';

const APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module.js');
const ErrorHandler = require(process.env.CS_API_TOP + '/server_utils/error_handler');
const Errors = require('./errors');
const RestfulErrors = require(process.env.CS_API_TOP + '/lib/util/restful/errors');
const AuthErrors = require(process.env.CS_API_TOP + '/modules/authenticator/errors');
const UserErrors = require(process.env.CS_API_TOP + '/modules/users/errors');

const ROUTES = [
	{
		method: 'put',
		path: '/no-auth/provider-connect/:provider',
		requestClass: require('./provider_connect_request')
	},
	{
		method: 'get',
		path: '/no-auth/provider-auth/:provider',
		requestClass: require('./provider_auth_request')
	},
	{
		method: 'get',
		path: '/no-auth/provider-token/:provider',
		requestClass: require('./provider_token_request')
	},
	{
		method: 'get',
		path: '/provider-auth-code',
		requestClass: require('./provider_authcode_request')
	},
	{
		method: 'put',
		path: '/provider-deauth/:provider',
		requestClass: require('./provider_deauth_request')
	},
	{
		method: 'get',
		path: '/provider-refresh/:provider',
		requestClass: require('./provider_refresh_request')
	},
	{
		method: 'put',
		path: '/provider-set-token/:provider',
		requestClass: require('./provider_set_token_request')
	},
	{
		method: 'put',
		path: '/provider-info/:provider',
		requestClass: require('./provider_info_request')
	},
	{
		method: 'put',
		path: 'provider-host/:provider/:teamId',
		requestClass: require('./provider_host_request')
	},
	{
		method: 'delete',
		path: 'provider-host/:provider/:teamId/:providerId',
		requestClass: require('./delete_provider_host_request')
	},
	{
		method: 'post',
		path: '/no-auth/provider-action/:provider',
		requestClass: require('./provider_action_request')
	}
];

class Providers extends APIServerModule {

	constructor (options) {
		super(options);
		this.errorHandler = new ErrorHandler(Errors);
		this.errorHandler.add(RestfulErrors);
		this.errorHandler.add(UserErrors);
		this.errorHandler.add(AuthErrors);		
	}

	getRoutes () {
		return ROUTES;
	}

	middlewares () {
		return (request, response, next) => {
			if (this.api.config.api.mockMode) {
				return next();
			}

			// HACK: the provider-action request (coming from slack) is form data with a value that is 
			// encoded JSON data ... monumentally stupid
			if (!request.path.match(/^\/no-auth\/provider-action/)) {
				return next();
			}

			let data = '';
			request.on('data', chunk => { 
				data += chunk;
			});
			request.on('end', () => {
				const [ key, value ] = data.split('=');
				if (key === 'payload') {
					try {
						request.body = { payload: JSON.parse(decodeURIComponent(value)) };
					}
					catch (error) {
						request.body = { };
					}
				}
				next();
			});
		};
	}

	// describe any errors associated with this module, for help
	describeErrors () {
		return {
			'Provider': Errors
		};
	}
}

module.exports = Providers;
