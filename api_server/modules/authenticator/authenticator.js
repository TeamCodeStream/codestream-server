// provides a middleware function to perform user authentication

'use strict';

const APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module.js');
const TokenAuthenticator = require('./token_authenticator');
const User = require(process.env.CS_API_TOP + '/modules/users/user');

const DEPENDENCIES = [
	'body_parser',	// have to be able to parse the request payload
	'cookie_parser'	// we accept authentication in the form of a cookie
];

class Authenticator extends APIServerModule {

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
					userClass: User
				}).authenticate();
			}
			catch (error) {
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
}

module.exports = Authenticator;
