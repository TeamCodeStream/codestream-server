// handle the "PUT /check_reset" request to check the validity of a token issues for resetting password

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
const AuthenticatorErrors = require(process.env.CS_API_TOP + '/modules/authenticator/errors');
const Indexes = require('./indexes');

class CheckResetRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(AuthenticatorErrors);
	}

	async authorize () {
		// no authorization necessary, authorization handled during the request processing
	}

	// process the request....
	async process () {
		await this.requireAndAllow();	// require certain parameters, and discard unknown parameters
		await this.verifyToken();       // make sure the token is valid, and parse the payload
		await this.getUser();           // get the user associated with the email in the token
		await this.validateToken();     // verify the token is not expired, per th\e most recently issued token
	}

	// require these parameters, and discard any unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters(
			'query',
			{
				required: {
					string: ['t']
				}
			}
		);
		this.token = this.request.query.t;
	}

	// parse and verify the passed token
	async verifyToken () {
		try {
			this.payload = this.api.services.tokenHandler.verify(this.token);
		}
		catch (error) {
			const message = typeof error === 'object' ? error.message : error;
			if (message === 'jwt expired') {
				throw this.errorHandler.error('tokenExpired');
			}
			else {
				throw this.errorHandler.error('tokenInvalid', { reason: message });
			}
		}
		if (this.payload.type !== 'rst') {
			throw this.errorHandler.error('tokenInvalid', { reason: 'not an rst token' });
		}
	}

	// get the user associated with the email in the token payload
	async getUser () {
		if (!this.payload.email) {
			throw this.errorHandler.error('tokenInvalid', { reason: 'no email found in rst token' });
		}
		const users = await this.data.users.getByQuery(
			{ 
				searchableEmail: this.payload.email.toLowerCase() 
			},
			{
				databaseOptions: {
					hint: Indexes.bySearchableEmail
				}
			}
		);
		if (users.length < 1) {
			throw this.errorHandler.error('tokenInvalid', { reason: 'user not found' });
		}
		this.user = users[0];
	}
	// verify the token is not expired, per the most recently issued token
	async validateToken () {
		const accessTokens = this.user.get('accessTokens') || {};
		const resetTokens = accessTokens.rst || {};
		if (!resetTokens || !resetTokens.minIssuance) {
			throw this.errorHandler.error('tokenInvalid', { reason: 'no issuance for rst token found' });
		}
		if (resetTokens.minIssuance > this.payload.iat * 1000) {
			throw this.errorHandler.error('tokenInvalid', { reason: 'a more recent rst token has been issued' });
		}
		this.responseData = {
			email: this.payload.email
		};
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'check-reset',
			summary: 'Check that a token can still be used to reset a user\'s password',
			access: 'No access rules, though the token must be valid and not expired',
			description: 'Use this API to check that a token that was issued for password reset will still work. This would be called in advance of displaying a form where the user would type in a new password, sort of a pre-flight check that the password reset will work.',
			input: {
				summary: 'Specify the token as a query parameter',
				looksLike: {
					't*': '<Reset password token>'
				}
			},
			returns: {
				summary: 'The email associated with the token',
				looksLike: {
					email: '<User\'s email>'
				}
			},
			errors: [
				'parameterRequired',
				'tokenInvalid',
				'tokenExpired'
			]
		};
	}
}

module.exports = CheckResetRequest;
