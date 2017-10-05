'use strict';

var API_Server_Module = require(process.env.CI_API_TOP + '/lib/api_server/api_server_module.js');
var Token_Authenticator = require('./token_authenticator');

const DEPENDENCIES = [
	'body_parser',
	'cookie_parser'
];

class Authenticator extends API_Server_Module {

	get_dependencies () {
		return DEPENDENCIES;
	}

	middlewares () {
		return (request, response, next) => {
			new Token_Authenticator({
				request: request,
				response: response,
				api: this.api
			}).authenticate((error) => {
				if (error) {
					response.set('WWW-Authenticate', 'Bearer');
					request.abort_with = {
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
