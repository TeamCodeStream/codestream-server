'use strict';

var APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module.js');
var TokenAuthenticator = require('./token_authenticator');
var User = require(process.env.CS_API_TOP + '/services/api/modules/users/user');

const DEPENDENCIES = [
	'body_parser',
	'cookie_parser'
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
