'use strict';

const Indexes = require('./indexes');
const { callbackWrap } = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/await_utils');
const BCrypt = require('bcrypt');

const MAX_LOGIN_CODE_ATTEMPTS = 3;

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

	async loginByCode (email, loginCode) {
		this.email = email;
		this.loginCode = loginCode;
		await this.getUser();
		await this.validateLoginCode();
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

	// validate that the given login code matches the one stored for the user,
	// that it isn't expired, and that the user hasn't tried too many attempts
	async validateLoginCode () {
		// avoid email harvesting vulnerability
		if (!this.user || this.user.get('deactivated')) {
			throw this.request.errorHandler.error('loginCodeMismatch');
		}
		try {
			if (this.user.get('loginCodeAttempts') === undefined || parseInt(this.user.get('loginCodeAttempts')) >= parseInt(MAX_LOGIN_CODE_ATTEMPTS)) {
				throw this.request.errorHandler.error('tooManyLoginCodeAttempts');
			}
			if (!this.user.get('loginCode') || this.user.get('loginCode') !== this.loginCode) {
				throw this.request.errorHandler.error('loginCodeMismatch');
			}
			if (!this.user.get('loginCodeExpiresAt') || Date.now() > this.user.get('loginCodeExpiresAt')) {
				throw this.request.errorHandler.error('loginCodeExpired');
			}
		} catch (error) {
			const op = {
				$inc: {
					loginCodeAttempts: 1,
				}
			};
			this.request.data.users.updateDirect(
				{ id: this.request.data.users.objectIdSafe(this.user.id) },
				op
			);
			throw error;
		}
	}
}

module.exports = LoginCore;
