// handle the "PUT /forgot-password" request to send out an email for user to reset their password

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
const UserValidator = require('./user_validator');
const Indexes = require('./indexes');

class ForgotPasswordRequest extends RestfulRequest {

	async authorize () {
		// no authorization required
	}

	// process the request....
	async process () {
		await this.requireAndAllow();	// require certain parameters, and discard unknown parameters
		await this.validateEmail();     // make sure the email is valid
		await this.getUser();			// get the user associated with this email
		await this.generateToken();	    // generate the token to send out in the email
		await this.saveTokenInfo();		// save token info with the user 
		await this.sendEmail();         // send the email to the user
	}

	// require these parameters, and discard any unknown parameters
	async requireAndAllow () {
		this.delayEmail = this.request.body._delayEmail; // delay sending the reset password email, for testing
		delete this.request.body._delayEmail;
		this.confirmationCheat = this.request.body._confirmationCheat;	// send the token back in the response, for testing
		delete this.request.body._confirmationCheat;
		await this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['email']
				},
				optional: {
					number: ['expiresIn']
				}
			}
		);
	}

	// validate that the existing password matches the password hash stored for the user
	async validateEmail () {
		const error = new UserValidator().validateEmail(this.request.body.email);
		if (error) {
			throw this.errorHandler.error('validation', { info: `email ${error}` });
		}
	}

	// get the user account associated with this email
	async getUser () {
		const users = await this.data.users.getByQuery(
			{ 
				searchableEmail: this.request.body.email.toLowerCase()
			},
			{
				databaseOptions: {
					hint: Indexes.bySearchableEmail
				}
			}
		);
		this.user = users.length > 0 ? users[0] : null;
	}

	// generate a new access token for the user, all other access tokens will be invalidated by this
	async generateToken () {
		if (!this.user) { return; }
		// time till expiration can be provided (normally for testing purposes),
		// or default to configuration
		let expiresIn = this.api.config.api.forgotPasswordExpiration;
		if (this.request.body.expiresIn && this.request.body.expiresIn < expiresIn) {
			this.warn('Overriding configured reset password expiration to ' + this.request.body.expiresIn);
			expiresIn = this.request.body.expiresIn;
		}
		const expiresAt = Date.now() + expiresIn;
		this.token = this.api.services.tokenHandler.generate(
			{ email: this.request.body.email },
			'rst',
			{ expiresAt }
		);
		this.minIssuance = this.api.services.tokenHandler.decode(this.token).iat * 1000;
	}

	// save the token info in the database, note that we don't save the actual token, just the notion
	// that all reset tokens issued previous to this one are no longer valid
	async saveTokenInfo () {
		if (!this.user) { return; }
		const op = {
			'$set': {
				'accessTokens.rst': {
					minIssuance: this.minIssuance
				}
			}
		};
		await this.data.users.applyOpById(this.user.id, op);
	}

	// send out the email
	async sendEmail () {
		if (!this.user) { 
			// no account associated with this email, just drop it to the floor
			this.api.warn(`Not sending reset password email to ${this.request.body.email}, email not found`);
			return;
		}

		// email send can be delayed for testing
		if (this.delayEmail) {
			setTimeout(this.sendEmail.bind(this), this.delayEmail);
			delete this.delayEmail;
			return;
		}

		// generate the url
		const host = this.api.config.webclient.host;
		const url = `${host}/reset-password/${encodeURIComponent(this.token)}`;

		// send the email
		await this.api.services.email.sendResetPasswordEmail(
			{
				user: this.user,
				request: this,
				url
			}
		);

		// send the token back in the response, if we're testing
		if (this.confirmationCheat === this.api.config.secrets.confirmationCheat) {
			// this allows for testing without actually receiving the email
			this.log('Confirmation cheat detected for forgot-password, hopefully this was called by test code');
			this.responseData.token = this.token;
		}
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'forgot-password',
			summary: 'Send a reset password email',
			access: 'No access rules',
			description: 'Send an email to a user for them to initiate the reset password process. The email contains a link they click on that will take them to the web. The link contains a token that expires after 24 hours.',
			input: {
				summary: 'Specify the email in the request body',
				looksLike: {
					'email*': '<User\'s email>'
				}
			},
			returns: 'An empty object',
			errors: [
				'parameterRequired',
				'validation'
			]
		};
	}
}

module.exports = ForgotPasswordRequest;
