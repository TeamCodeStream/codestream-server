'use strict';

const Indexes = require('./indexes');
const { callbackWrap } = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/await_utils');
const BCrypt = require('bcrypt');

class LoginCore {

	constructor (options) {
		Object.assign(this, options);
	}

	async login (email, password) {
		this.email = email;
		this.password = password;
		await this.getUser();
		await this.validatePassword();
		return this.user;
	}

	// get the user indicated by the passed email
	async getUser () {
		this.user = await this.request.data.users.getOneByQuery(
			{
				searchableEmail: this.email.toLowerCase()
			},
			{
				hint: Indexes.bySearchableEmail
			}
		);
		/*
		// Killing this check to avoid email harvesting vulnerability, instead we'll drop through
		// and return a password mismatch error even if the user doesn't exist
		if (!this.user || this.user.get('deactivated')) {
			throw this.errorHandler.error('notFound', { info: 'email' });
		}
		*/
	}

	// validate that the given password matches the password hash stored for the user
	async validatePassword () {
		let result;
		try {
			if (
				this.user &&
				!this.user.get('deactivated') &&
				this.user.get('passwordHash')
			) {
				result = await callbackWrap(
					BCrypt.compare,
					this.password,
					this.user.get('passwordHash')
				);
			}
		}
		catch (error) {
			throw this.request.errorHandler.error('token', { reason: error });
		}
		if (!result) {
			throw this.request.errorHandler.error('passwordMismatch');
		}
		if (!this.user.get('isRegistered')) {
			throw this.request.errorHandler.error('noLoginUnregistered');
		}
	}
}

module.exports = LoginCore;
