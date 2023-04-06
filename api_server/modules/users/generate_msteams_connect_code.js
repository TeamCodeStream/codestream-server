// handle the "POST /msteams/generate-connect-code" request to have a signup token sent back to user

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request.js');
const SignupTokens = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/signup_tokens');
const UUID = require('uuid').v4;

class GenerateMSTeamsConnectCodeRequest extends RestfulRequest {

	async authorize () {
		// no authorization needed, the request always applies to the authenticated user
	}

	async process () {
		await this.updateUserSignupToken(); // generate and save a login code for the requested email address
	}

	async handleResponse () {
		this.responseData = {
			connectCode: this.connectCode
		};

		await super.handleResponse();
	}

	// generate and save a login code for the requested email address
	async updateUserSignupToken () {
		const signupTokens = new SignupTokens({ api: this.api });
		signupTokens.initialize();

		// replace the hyphens with nothing as it makes copy/pasting easier
		const tenantToken = UUID().replace(/-/g, '');
		await signupTokens.insert(tenantToken, this.user.id, {
			expiresIn: 600000,
			more: {
				teamIds: this.user.get('teamIds') || []
			}
		});

		this.connectCode = tenantToken;
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'connectCode',
			summary: 'Generates a connect code',
			access: 'Operates on the authenticated user directly',
			description: 'Generates a code allowing a user to connect their CS account with MSTeams',
		};
	}
}

module.exports = GenerateMSTeamsConnectCodeRequest;
