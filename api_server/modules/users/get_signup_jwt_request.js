// handle the "GET /signup-jwt" request to fetch a signup JWT token,
// per New Relic signup flow requirements

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request.js');
const JWT = require('jsonwebtoken');

const IDEMappings = {
	'VS Code': 'vscode',
	'JetBrains': 'jetbrains',
	'VS': 'vs',
	'Atom': 'atom'
};

class GetSignupJWTRequest extends RestfulRequest {

	async authorize () {
		// no authorization necessary, always applies to current user
	}

	// process the request...
	async process () {
		const secret = this.api.config.sharedSecrets.signupFlowJWT;
		if (!secret) {
			throw this.errorHandler.error('missingArgument', { info: 'not configured for email validation signing' });
		}

		const origin = this.user.get('lastOrigin');
		const ide = IDEMappings[origin] || '';
		const payload = {
			id: this.user.id,
			name: this.user.get('fullName'),
			email: this.user.get('email'),
			protocolHandling: ide === 'vscode',
			ide
		};

		const token = JWT.sign(payload, secret);
		this.responseData = { token };
	}
}

module.exports = GetSignupJWTRequest;
