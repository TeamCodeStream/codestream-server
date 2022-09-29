'use strict';

const BCrypt = require('bcrypt');
const { callbackWrap } = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/await_utils');
const PasswordHasher = require('./password_hasher');
const UserValidator = require('./user_validator');
const AccessTokenCreator = require('./access_token_creator');

class ChangePasswordCore {

	constructor (options) {
		Object.assign(this, options);
	}

	// set a password on a user wo/checking their existing password
	async setPassword(user, newPassword) {			
		await this.savePassword([user], newPassword);
	}

	async setPasswordForUsers(users, newPassword) {
		return this.savePassword(users, newPassword);
	}

	// set a password on a user checking their existing password
	async changePassword(user, newPassword, existingPassword) {				
		await this.savePassword([user], newPassword, existingPassword, true);
	}

	async savePassword(users, newPassword, existingPassword, validatePassword) {	
		if (validatePassword && users.length > 1) {
			throw 'only one user allowed for password validation';
		}	

		this.users = users;
		this.password = newPassword;		
		this.existingPassword = existingPassword;

		if (validatePassword) {
			await this.validatePassword();	// validate the given password matches their password hash
		}
		await this.hashPassword();		// hash the new password
		await Promise.all(this.users.map(async user => {
			const tokenInfo = await this.generateToken(user); // generate a new access token
			await this.updateUser(user, tokenInfo); // update the user's database record
		}));
	}

	// validate that the existing password matches the password hash stored for the user
	async validatePassword () {
		let result;
		try {
			result = await callbackWrap(
				BCrypt.compare,
				this.existingPassword,
				this.users[0].get('passwordHash')
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
	async generateToken (user) {
		return AccessTokenCreator(this.request, user.id);
	}

	// update the user in the database, with their new password hash and access tokens
	async updateUser (user, tokenInfo) {
		this.accessToken = tokenInfo.token;
		const accessTokens = user.get('accessTokens') || {};
		Object.keys(accessTokens).forEach(type => {
			if (type === 'rst' || type === 'conf') {
				delete accessTokens[type];
			}
			else {
				accessTokens[type].invalidated = true;
			}
		});
		accessTokens.web = {
			token: tokenInfo.accessToken,
			minIssuance: tokenInfo.minIssuance
		};
		const op = {
			'$set': {
				passwordHash: this.passwordHash,
				accessTokens: accessTokens
			}
		};
		await this.request.data.users.applyOpById(user.id, op);
	}
}

module.exports = ChangePasswordCore;
