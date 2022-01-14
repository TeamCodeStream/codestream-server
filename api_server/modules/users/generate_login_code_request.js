// handle the "POST /no-auth/login-code" request to have a login code sent to
// user's email address

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request.js');
const LoginCodeHelper = require('./login_code_helper');

class GenerateLoginCodeRequest extends RestfulRequest {

	async authorize () {
		// no pre-authorization needed
	}

	async process () {
		await this.requireAndAllow(); // require certain parameters, and discard unknown parameters
		await this.updateUserCode(); // generate and save a login code for the requested email address
	}

	async handleResponse () {
		if (this._loginCheat === this.api.config.sharedSecrets.confirmationCheat) {
			// this allows for testing without actually receiving the email
			this.log('Login code cheat detected, hopefully this was called by test code');
			this.responseData = {
				loginCode: this.codeData.loginCode
			};
		}
		await super.handleResponse();
	}

	async postProcess () {
		await this.sendLoginCodeEmail(); // send the email with the login code
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
		});
	}

	// generate and save a login code for the requested email address
	async updateUserCode () {
		this.loginCodeHelper = new LoginCodeHelper({
			request: this,
			email: this.request.body.email,
			_delayEmail: this._delayEmail,
			expiresIn: this.expiresIn
		});
		this.codeData = await this.loginCodeHelper.updateUserCode();
	}

	// send the email with the login code
	async sendLoginCodeEmail () {
		await this.loginCodeHelper.sendEmail();
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'loginCode',
			summary: 'Generates a login code',
			access: 'No authorization needed',
			description: 'Generates a login code for a user and sends them an email with the code',
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

module.exports = GenerateLoginCodeRequest;
