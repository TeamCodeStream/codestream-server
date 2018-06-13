// handle the "PUT /change-password" request to change the user's password

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
const BCrypt = require('bcrypt');
const { callbackWrap } = require(process.env.CS_API_TOP + '/server_utils/await_utils');
const PasswordHasher = require('./password_hasher');
const UserValidator = require('./user_validator');

class ChangePasswordRequest extends RestfulRequest {

	async authorize () {
		// only applies to current user, no authorization required
	}

	// process the request....
	async process () {
		await this.requireAndAllow();	// require certain parameters, and discard unknown parameters
		await this.validatePassword();	// validate the given password matches their password hash
		await this.hashPassword();		// hash the new password
		await this.generateToken();		// generate a new access token
		await this.updateUser();		// update the user's database record
	}

	// require these parameters, and discard any unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['newPassword', 'existingPassword']
				}
			}
		);
		this.password = this.request.body.newPassword;
		this.user = this.request.user;
	}

	// validate that the existing password matches the password hash stored for the user
	async validatePassword () {
		let result;
		try {
			result = await callbackWrap(
				BCrypt.compare,
				this.request.body.existingPassword,
				this.user.get('passwordHash')
			);
		}
		catch (error) {
			throw this.errorHandler.error('token', { reason: error });
		}
		if (!result) {
			throw this.errorHandler.error('passwordMismatch');
		}
	}

	// hash the given password, as needed
	async hashPassword () {
		const error = new UserValidator().validatePassword(this.password);
		if (error) {
			throw this.errorHandler.error('validation', { info: `password ${error}` });
		}
		this.passwordHash = await new PasswordHasher({
			errorHandler: this.errorHandler,
			password: this.password
		}).hashPassword();
	}

	// generate a new access token for the user, all other access tokens will be invalidated by this
	async generateToken () {
		this.accessToken = this.api.services.tokenHandler.generate({ uid: this.user.id });
		this.minIssuance = this.api.services.tokenHandler.decode(this.accessToken).iat * 1000;
		this.responseData = {
			accessToken: this.accessToken
		};
	}

	// update the user in the database, with their new password hash and access tokens
	async updateUser () {
		const accessTokens = this.user.get('accessTokens') || {};
		Object.keys(accessTokens).forEach(type => {
			if (type === 'rst' || type === 'conf') {
				delete accessTokens[type];
			}
			else {
				accessTokens[type].invalidated = true;
			}
		});
		accessTokens.web = {
			token: this.accessToken,
			minIssuance: this.minIssuance
		};
		const op = {
			'$set': {
				passwordHash: this.passwordHash,
				accessTokens: accessTokens
			}
		};
		this.user = await this.data.users.applyOpById(this.user.id, op);
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'password',
			summary: 'Change a user\'s password',
			access: 'Current user can only change their own password',
			description: 'Change a user\'s password, providing the current password for security. Note that this invalidates all current access tokens for the user; a new access token will be returned with the response to the request, but other sessions will no longer be able to authenticate.',
			input: {
				summary: 'Specify existing password and new password in the request body',
				looksLike: {
					'existingPassword*': '<User\'s existing password>',
					'newPassword*': '<User\'s new password>'
				}
			},
			returns: {
				summary: 'A new access token',
				looksLike: {
					accessToken: '<New access token>'
				}
			},
			errors: [
				'parameterRequired',
				'passwordMismatch',
				'validation'
			]
		};
	}
}

module.exports = ChangePasswordRequest;
