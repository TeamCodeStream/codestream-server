// provides a middleware function to perform user authentication

'use strict';

const APIServerModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/api_server/api_server_module.js');
const TokenAuthenticator = require('./token_authenticator');
const TokenHandler = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/token_handler');
const User = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/user');
const Errors = require('./errors');

const DEPENDENCIES = [
	'body_parser',	// have to be able to parse the request payload
	'cookie_parser'	// we accept authentication in the form of a cookie
];

class Authenticator extends APIServerModule {

	constructor (config) {
		super(config);
		this.tokenHandler = new TokenHandler(this.api.config.secrets.auth);
	}

	getDependencies () {
		return DEPENDENCIES;
	}

	middlewares () {
		return async (request, response, next) => {
			try {
				await new TokenAuthenticator({
					request: request,
					response: response,
					api: this.api,
					userClass: User,
					tokenHandler: this.tokenHandler
				}).authenticate();
			}
			catch (error) {
				if (this.pathIsWeb(request) && this.api.config.api.webErrorRedirect) {
					return response.redirect(this.api.config.api.webErrorRedirect + '?code=' + error.code);
				}
				// fail with a 401, signalling no authentication at all
				response.set('WWW-Authenticate', 'Bearer');
				request.abortWith = {
					status: 401,
					error: error
				};
			}
			next();
		};
	}

	services () {
		// return a function that, when invoked, returns a service structure with the token handler as a service
		return async () => {
			return { tokenHandler: this.tokenHandler };
		};
	}

	// certain paths are associated with web requests, and should be redirected to an error page
	pathIsWeb (request) {
		const paths = this.api.config.api.webPaths || [];
		return paths.find(path => {
			const regExp = new RegExp(path);
			return request.path.match(regExp);
		});
	}

	// describe any errors associated with this module, for help
	describeErrors () {
		return {
			'Authentication': Errors
		};
	}
}

module.exports = Authenticator;
