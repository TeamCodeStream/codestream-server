// handle the "POST /no-auth/register" request to register a new user (before confirming)

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request.js');
const Indexes = require('./indexes');

class ResendConfirmRequest extends RestfulRequest {

	async authorize () {
		// no authorization necessary ... though the email will be checked
	}

	// process the request...
	async process () {
		// This request is deprecated since confirmation emails now have the confirmation code
		throw 'deprecated';
		/*
		await this.requireAndAllow();		// require certain parameters, discard unknown parameters
		if (!await this.getUser()) {		// get the user associated with this email
			// no user, we just silently drop to the floor, no email harvesting!
			return false;
		}				
		await this.generateLinkToken();		// generate a token for the confirm link, as requested
		await this.saveTokenInfo();			// save the token info to the user object, if we're doing a confirm link
		await this.sendEmail();				// send the confirmation email with the confirmation code
		if (this.request.body._confirmationCheat === this.api.config.secrets.confirmationCheat) {
			// this allows for testing without actually receiving the email
			this.log('Confirmation cheat detected, hopefully this was called by test code');
			this.responseData.confirmationToken = this.token;
		}
		*/
	}

	// require certain parameters, discard unknown parameters
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

	// get the user associated with the passed email
	async getUser () {
		const users = await this.data.users.getByQuery(
			{ 
				searchableEmail: this.request.body.email.toLowerCase(),
			},
			{
				hint: Indexes.bySearchableEmail
			}
		);
		if (!users[0]) {
			this.warn(`Note - user ${this.request.body.email} not found, no email will be sent`);
			return false;
		}
		this.user = users[0];
		return true;
	}

	// generate a token for the confirm link
	async generateLinkToken () {
		// time till expiration can be provided (normally for testing purposes),
		// or default to configuration
		const providedExpiresIn = this.request.body.expiresIn;
		let expiresIn = this.api.config.api.confirmationExpiration;
		if (providedExpiresIn && providedExpiresIn < expiresIn) {
			this.warn('Overriding configured confirmation expiration to ' + providedExpiresIn);
			expiresIn = providedExpiresIn;
		}
		const expiresAt = Date.now() + expiresIn;
		this.token = this.api.services.tokenHandler.generate(
			{ uid: this.user.id },
			'conf',
			{ expiresAt }
		);
		this.minIssuance = this.api.services.tokenHandler.decode(this.token).iat * 1000;
	}

	// save the token info in the database, note that we don't save the actual token, just the notion
	// that all confirmation tokens issued previous to this one are no longer valid
	async saveTokenInfo () {
		const op = {
			'$set': {
				'accessTokens.conf': {
					minIssuance: this.minIssuance
				}
			}
		};
		await this.data.users.applyOpById(this.user.id, op);
	}

	// send out the confirmation email with the confirmation code
	async sendEmail () {
		const delayEmail = this.request.body._delayEmail;
		if (delayEmail) {
			setTimeout(this.sendEmail.bind(this), delayEmail);
			delete this.request.body._delayEmail;
			return;
		}

		// if the user is already registered, we send an email to this effect, rather
		// than sending the confirmation link
		if (this.user.get('isRegistered')) {
			this.log(`Triggering already-registered email to ${this.user.get('email')}...`);
			await this.api.services.email.queueEmailSend(
				{
					type: 'alreadyRegistered',
					userId: this.user.id
				},
				{
					request: this,
					user: this.user
				}
			);
		}

		// otherwise send a confirmation email with a link
		else {
			// generate the url
			const host = this.api.config.webclient.host;
			const url = `${host}/confirm-email/${encodeURIComponent(this.token)}`;
			this.log(`Triggering confirmation email to ${this.user.get('email')}...`);
			await this.api.services.email.queueEmailSend(
				{
					type: 'confirm',
					userId: this.user.id,
					url
				},
				{
					request: this,
					user: this.user
				}
			);
		}
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'resend-confirm',
			summary: 'Resends a confirmation email to a user',
			access: 'No authorization needed',
			description: 'Sends out a confirmation email to an unregistered user. If the email provided doesn\'t correspond to an existing user, the email won\'t be sent. If the user associated with the email does exist but is already registered, then an email will be sent indicating the user is already registered instead.',
			input: {
				summary: 'Specify attributes in the body',
				looksLike: {
					'email*': '<User\'s email>'
				}
			},
			returns: 'Empty object',
			errors: [
				'parameterRequired'
			]
		};
	}
}

module.exports = ResendConfirmRequest;
