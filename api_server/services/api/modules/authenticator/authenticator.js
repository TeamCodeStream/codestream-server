// provides a middleware function to perform user authentication

'use strict';

var APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module.js');
var TokenAuthenticator = require('./token_authenticator');
var User = require(process.env.CS_API_TOP + '/services/api/modules/users/user');

const DEPENDENCIES = [
	'body_parser',	// have to be able to parse the request payload
	'cookie_parser'	// we accept authentication in the form of a cookie
];

class Authenticator extends APIServerModule {

	getDependencies () {
		return DEPENDENCIES;
	}

	middlewares () {
		return (request, response, next) => {
			new TokenAuthenticator({
				request: request,
				response: response,
				api: this.api,
				userClass: User
			}).authenticate((error) => {
				if (error) {
					// fail with a 401, signalling no authentication at all
					response.set('WWW-Authenticate', 'Bearer');
					request.abortWith = {
						status: 401,
						error: error
					};
				}
				next();
			});
		};
	}
}

module.exports = Authenticator;
