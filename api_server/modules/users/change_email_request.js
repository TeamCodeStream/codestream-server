// handle the "PUT /change-email" request to change the user's email
// (really: actually send out an email for confirmation)

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
const UserValidator = require('./user_validator');

class ChangeEmailRequest extends RestfulRequest {

	async authorize () {
		// only applies to current user, no authorization required
	}

	// process the request....
	async process () {
		// this request is deprecated until we support email change from the IDE
		throw 'deprecated';
		/*
		await this.requireAndAllow();	// require certain parameters, and discard unknown parameters
		await this.validateEmail();		// make sure the new email is valid
		await this.generateToken();		// generate a token for the email
		await this.saveTokenInfo();		// save the token info
		await this.sendEmail();			// send the confirmation email
		*/
	}

	// require these parameters, and discard any unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['email']
				},
				optional: {
					string: ['_confirmationCheat'],
					number: ['_delayEmail', 'expiresIn']
				}
			}
		);
	}

	// validate the passed email
	async validateEmail () {
		const error = new UserValidator().validateEmail(this.request.body.email);
		if (error) {
			throw this.errorHandler.error('validation', { info: `email ${error}` });
		}
	}

	// generate a token for the confirm link
	async generateToken () {
		// time till expiration can be provided (normally for testing purposes),
		// or default to configuration
		let expiresIn = this.api.config.api.confirmationExpiration;
		if (this.request.body.expiresIn && this.request.body.expiresIn < expiresIn) {
			this.warn('Overriding configured confirmation expiration to ' + this.request.body.expiresIn);
			expiresIn = this.request.body.expiresIn;
		}
		const expiresAt = Date.now() + expiresIn;
		this.token = this.api.services.tokenHandler.generate(
			{ 
				uid: this.user.id,
				email: this.request.body.email
			},
			'email',
			{ expiresAt }
		);
		this.minIssuance = this.api.services.tokenHandler.decode(this.token).iat * 1000;

		if (this.request.body._confirmationCheat === this.api.config.secrets.confirmationCheat) {
			// this allows for testing without actually receiving the email
			this.log('Confirmation cheat detected, hopefully this was called by test code');
			this.responseData = {
				confirmationToken: this.token
			};
		}
	}

	// save the token info in the database, note that we don't save the actual token, just the notion
	// that all confirmation tokens issued previous to this one are no longer valid
	async saveTokenInfo () {
		const op = {
			'$set': {
				'accessTokens.email': {
					minIssuance: this.minIssuance
				}
			}
		};
		await this.data.users.applyOpById(this.user.id, op);
	}

	// send out the confirmation email with a link and the token
	async sendEmail () {
		// possible delay for testing purposes
		if (this.request.body._delayEmail) {
			setTimeout(this.sendEmail.bind(this), this.request.body._delayEmail);
			delete this.request.body._delayEmail;
			return;
		}

		// generate the url and send the email
		const host = this.api.config.webclient.host;
		const url = `${host}/a/settings?confirm_email_token=${encodeURIComponent(this.token)}`;
		this.log(`Triggering change-email confirmation email to ${this.user.get('email')}...`);
		await this.api.services.email.queueEmailSend(
			{
				type: 'changeEmail',
				userId: this.user.id,
				url
			},
			{
				request: this,
				user: this.user
			}
		);
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'change-email',
			summary: 'Initiate changing a user\'s email by sending a confirmation email to the new email',
			access: 'Current user can only change their own email',
			description: 'Initiate the process of a user changing their own email, by sending out a confirmation email with a link to confirm the email through the web app',
			input: {
				summary: 'Specify new email in the request body',
				looksLike: {
					'email*': '<User\'s new email>'
				}
			},
			returns: 'nothing',
			errors: [
				'parameterRequired',
				'validation'
			]
		};
	}
}

module.exports = ChangeEmailRequest;
