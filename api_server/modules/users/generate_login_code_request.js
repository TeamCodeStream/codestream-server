// handle the "POST /no-auth/login-code" request to have a login code sent to
// user's email address

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request.js');
const ConfirmCode = require('./confirm_code');
const Indexes = require('./indexes');

class GenerateLoginCodeRequest extends RestfulRequest {

	async authorize () {
		// no pre-authorization needed
	}

	async process () {
		await this.requireAndAllow(); // require certain parameters, and discard unknown parameters
		await this.getUser(); // fetch the user object for the requested email address
		await this.generateLoginCode(); // generate a login code and expiry date
		await this.updateUser(); // write the model to the user database
	}

	async handleResponse () {
		if (this._loginCheat === this.api.config.sharedSecrets.confirmationCheat) {
			// this allows for testing without actually receiving the email
			this.log('Login code cheat detected, hopefully this was called by test code');
			this.responseData = {
				loginCode: this.loginCode
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

	// fetch the user object for the requested email address
	async getUser () {
		this.user = await this.data.users.getOneByQuery(
			{ searchableEmail: this.request.body.email.toLowerCase() },
			{ hint: Indexes.bySearchableEmail }
		);
	}

	// generate a login code and expiry date
	async generateLoginCode () {
		if (!this.user) {
			return;
		}

		this.loginCode = ConfirmCode();
		// FIXME: this should be configurable
		const expiresIn = 15*60*1000;
		if (this.expiresIn && this.expiresIn < expiresIn) {
			this.loginCodeExpiresAt = Date.now() + this.expiresIn;
		}
		else {
			this.loginCodeExpiresAt = Date.now() + expiresIn;
		}
		this.loginCodeAttempts = 0;
	}

	// write the model to the user database
	async updateUser () {
		if (!this.user) {
			return;
		}

		const op = {
			$set: {
				loginCode: this.loginCode,
				loginCodeExpiresAt: this.loginCodeExpiresAt,
				loginCodeAttempts: this.loginCodeAttempts,
			},
		};
		this.data.users.applyOpById(this.user.id, op);
	}

	// send the email with the login code
	async sendLoginCodeEmail () {
		if (!this.user) {
			return;
		}
		if (this._delayEmail) {
			setTimeout(this.sendLoginCodeEmail.bind(this), this._delayEmail);
			delete this._delayEmail;
			return;
		}

		this.log(`Triggering email with login code to ${this.user.get('email')}...`);
		await this.api.services.email.queueEmailSend(
			{
				type: 'loginCode',
				userId: this.user.id,
			},
			{
				request: this,
				user: this.user,
			}
		);
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
