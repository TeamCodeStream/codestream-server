'use strict';

const BCrypt = require('bcrypt');
const { callbackWrap } = require(process.env.CS_API_TOP + '/server_utils/await_utils');
const PasswordHasher = require('./password_hasher');
const UserValidator = require('./user_validator');

class ChangePasswordCore {

	constructor (options) {
		Object.assign(this, options);
	}

	// set a password on a user wo/checking their existing password
	async setPassword(user, newPassword) {			
		await this.savePassword(user, newPassword);
	}

	// set a password on a user checking their existing password
	async changePassword(user, newPassword, existingPassword) {				
		await this.savePassword(user, newPassword, existingPassword, true);
	}

	async savePassword(user, newPassword, existingPassword, validatePassword) {		
		this.user = user;
		this.password = newPassword;		
		this.existingPassword = existingPassword;

		if (validatePassword) {
			await this.validatePassword();	// validate the given password matches their password hash
		}
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
				this.existingPassword,
				this.user.get('passwordHash')
			);
		}
		catch (error) {
			throw this.request.errorHandler.error('token', { reason: error });
		}
		if (!result) {
			throw this.request.errorHandler.error('passwordMismatch');
		}
	}

	// hash the given password, as needed
	async hashPassword () {
		const error = new UserValidator().validatePassword(this.password);
		if (error) {
			throw this.request.errorHandler.error('validation', { info: `password ${error}` });
		}
		this.passwordHash = await new PasswordHasher({
			errorHandler: this.request.errorHandler,
			password: this.password
		}).hashPassword();
	}

	// generate a new access token for the user, all other access tokens will be invalidated by this
	async generateToken () {
		this.accessToken = this.request.api.services.tokenHandler.generate({ uid: this.user.id });
		this.minIssuance = this.request.api.services.tokenHandler.decode(this.accessToken).iat * 1000;
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
		this.user = await this.request.data.users.applyOpById(this.user.id, op);
	}
}

module.exports = ChangePasswordCore;
