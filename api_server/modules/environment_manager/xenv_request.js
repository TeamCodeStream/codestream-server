// base class for cross-environmental (xenv) requests

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request');
const AuthErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/authenticator/errors');

class XEnvRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(AuthErrors);
	}

	// authorize the client to make this request
	async authorize () {
		// we rely on a secret, known only to our servers
		if (this.request.headers['x-cs-auth-secret'] !== this.api.config.environmentGroupSecrets.requestAuth) {
			this.response.status(401);
			throw this.errorHandler.error('missingAuthorization');
		}
	}
}

module.exports = XEnvRequest;
