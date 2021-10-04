// handle the "GET /no-auth/validate-email" request to validate a confirmed email,
// per New Relic signup flow requirements

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request.js');
const Indexes = require('./indexes');
const JWT = require('jsonwebtoken');

const IDEMappings = {
	'VS Code': 'vscode',
	'JetBrains': 'jetbrains',
	'VS': 'vs',
	'Atom': 'atom'
};

class ValidateEmailRequest extends RestfulRequest {

	async authorize () {
		// no authorization necessary, email info will be encoded
	}

	// process the request...
	async process () {
		await this.requireAndAllow();	// require certain parameters, discard unknown parameters
		await this.validate();			// validate the email, sending a JWT response
	}

	// require certain parameters, discard unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['email']
				}
			}
		);
	}

	// validate the email, sending a JWT response in either case
	async validate () {
		const user = await this.data.users.getOneByQuery(
			{ searchableEmail: this.request.body.email.toLowerCase() },
			{ hint: Indexes.bySearchableEmail }
		);
		let payload = {};
		if (!user) {
			payload = this.errorHandler.error('notFound', { info: 'user' });
		} else if (!user.get('isRegistered')) {
			payload = this.errorHandler.error('noLoginUnregistered');
		} else {
			const origin = user.get('lastOrigin');
			const ide = IDEMappings[origin] || '';
			payload = {
				id: user.id,
				name: user.get('fullName'),
				email: user.get('email'),
				protocolHandling: !!ide,
				ide
			};
		}

		if (payload.code) {
			payload.errorCode = payload.code;
			delete payload.code;
			payload.email = this.request.body.email.toLowerCase();
		}

		const secret = this.api.config.sharedSecrets.signupFlowJWT;
		if (!secret) {
			throw this.errorHandler.error('missingArgument', { info: 'not configured for email validation signing' });
		}
		const token = JWT.sign(payload, secret);

		this.responseData = { token };
	}
}

module.exports = ValidateEmailRequest;
