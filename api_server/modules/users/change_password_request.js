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
		const error = new UserValidator().validatePassword(this.request.body.newPassword);
		if (error) {
			throw this.errorHandler.error('validation', { info: `password ${error}` });
		}
		this.passwordHash = await new PasswordHasher({
			errorHandler: this.errorHandler,
			password: this.request.body.newPassword
		}).hashPassword();
	}

	// update the user in the database, with their new password hash
	async updateUser () {
		const op = {
			'$set': {
				passwordHash: this.passwordHash
			},
		};
		this.user = await this.data.users.applyOpById(this.user.id, op);
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'password',
			summary: 'Change a user\'s password',
			access: 'Current user can only change their own password',
			description: 'Change a user\'s password, providing the current password for security',
			input: {
				summary: 'Specify existing password and new password in the request body',
				looksLike: {
					'existingPassword*': '<User\'s existing password>',
					'newPassword*': '<User\'s new password>'
				}
			},
			returns: 'Empty object',
			errors: [
				'parameterRequired',
				'passwordMismatch',
				'validation'
			]
		};
	}
}

module.exports = ChangePasswordRequest;
