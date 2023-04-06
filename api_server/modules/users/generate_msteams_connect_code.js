// handle the "POST /no-auth/msteams-connect-code" request to have a login code sent to
// user's email address

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request.js');
const LoginCodeHelper = require('./login_code_helper');

class GenerateMSTeamsConnectCodeRequest extends RestfulRequest {

	async authorize () {
		// no pre-authorization needed
	}

	async process () {
		await this.requireAndAllow(); // require certain parameters, and discard unknown parameters
		await this.updateUserCode(); // generate and save a login code for the requested email address
	}

	async handleResponse () {
        this.responseData = {
            connectCode: this.codeData.loginCode
        };

        await super.handleResponse();
	}

	// require certain parameters, and discard unknown parameters
	async requireAndAllow () {
		[
			'_loginCheat',
			'_delayEmail',
			'expiresIn'
		].forEach(parameter => {
			this[parameter] = this.request.body[parameter];
			delete this.request.body[parameter];
		});
		await this.requireAllowParameters('body', {
			required: {
				string: ['email'],
			},
			optional: {
				string: ['teamId']
			}
		});
	}

	// generate and save a login code for the requested email address
	async updateUserCode () {
		this.loginCodeHelper = new LoginCodeHelper({
			request: this,
			email: this.request.body.email,
			teamId: this.request.body.teamId,
			_delayEmail: this._delayEmail,
			expiresIn: this.expiresIn,
            target: "msteams"
		});
		this.codeData = await this.loginCodeHelper.updateUserCode();
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'connectCode',
			summary: 'Generates a connect code',
			access: 'No authorization needed',
			description: 'Generates a code allowing a user to connect their CS account with MSTeams',
			input: {
				summary: 'Specify attributes in the body',
				looksLike: {
					'email*': '<User\'s email>'
				},
			},
			errors: [
				'parameterRequired'
			]
		};
	}
}

module.exports = GenerateMSTeamsConnectCodeRequest;
