// handle the "PUT /change-email-confirm" request to accept a token confirming
// a new email for a user

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
const UserPublisher = require('./user_publisher');
const AuthenticatorErrors = require(process.env.CS_API_TOP + '/modules/authenticator/errors');
const ModelSaver = require(process.env.CS_API_TOP + '/lib/util/restful/model_saver');

class ChangeEmailConfirmRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(AuthenticatorErrors);
	}

	async authorize () {
		// only applies to the user in the token payload, no authorization required
	}

	// process the request....
	async process () {
		await this.requireAndAllow();	// require certain parameters, and discard unknown parameters
		await this.verifyToken();       // make sure the token is valid, and parse the payload
		await this.getUser();           // get the user associated with the ID in the token
		await this.validateToken();     // verify the token is not expired, per the most recently issued token
		await this.updateUser();		// update the user object with the new email
	}

	// require these parameters, and discard any unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['token']
				}
			}
		);
		this.token = this.request.body.token;
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
		if (this.payload.type !== 'email') {
			throw this.errorHandler.error('tokenInvalid', { reason: 'not an email token' });
		}
	}

	// get the user associated with the ID in the token payload
	async getUser () {
		if (!this.payload.uid) {
			throw this.errorHandler.error('tokenInvalid', { reason: 'no uid found in token' });
		}
		if (!this.payload.email) {
			throw this.errorHandler.error('tokenInvalid', { reason: 'no email found in token' });
		}
		this.user = await this.data.users.getById(this.payload.uid);
		if (!this.user) {
			throw this.errorHandler.error('tokenInvalid', { reason: 'user not found' });
		}
	}

	// verify the token is not expired, per the most recently issued token
	async validateToken () {
		const accessTokens = this.user.get('accessTokens') || {};
		const emailToken = accessTokens.email || {};
		if (!emailToken || !emailToken.minIssuance) {
			throw this.errorHandler.error('tokenInvalid', { reason: 'no issuance for email token found' });
		}
		if (emailToken.minIssuance > this.payload.iat * 1000) {
			throw this.errorHandler.error('tokenInvalid', { reason: 'a more recent email token has been issued' });
		}
	}

	// update the user in the database with new email
	async updateUser () {
		const op = {
			'$set': {
				email: this.payload.email,
				modifiedAt: Date.now()
			}
		};
		this.updateOp = await new ModelSaver({
			request: this,
			collection: this.data.users,
			id: this.user.id
		}).save(op);
	}

	async handleResponse () {
		if (this.gotError) {
			return await super.handleResponse();
		}
		this.responseData = { user: this.updateOp };
		super.handleResponse();
	}

	// after the request returns a response....
	async postProcess () {
		// publish the updated user directive to all the team members
		await this.publishUserToTeams();
	}

	// publish the updated user directive to all the team members,
	// over the team channel
	async publishUserToTeams () {
		await new UserPublisher({
			user: this.user,
			data: this.responseData.user,
			request: this,
			messager: this.api.services.messager
		}).publishUserToTeams();
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'change-email-confirm',
			summary: 'Confirm a user changing their email',
			access: 'Must provide the token from the email issued in the @@#change-email#change-email@@ request',
			description: 'Given the token issued in the email sent by a @@#change-email#change-email@@ request, assume the email has been confirmed and change it',
			input: {
				summary: 'Specify the token in the request body',
				looksLike: {
					'token*': '<Token from change-email confirmation email>'
				}
			},
			returns: {
				summary: 'Directive to set the user\'s new email',
				looksLike: {
					user: {
						id: '<ID of the user>',
						$set: {
							email: '<New email>'
						}
					}
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

module.exports = ChangeEmailConfirmRequest;
