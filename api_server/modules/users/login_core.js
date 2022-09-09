'use strict';

const Indexes = require('./indexes');
const { callbackWrap } = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/await_utils');
const BCrypt = require('bcrypt');

const MAX_LOGIN_CODE_ATTEMPTS = 3;

class LoginCore {

	constructor (options) {
		Object.assign(this, options);
	}

	async login (email, password, teamId = undefined) {
		this.email = email;
		this.password = password;
		this.teamId = teamId;
		await this.getUsers();
		await this.validateByPassword();
		if (!this.user) {
			throw this.request.errorHandler.error('passwordMismatch');
		}
		return this.user;
	}

	async loginByCode (email, loginCode, teamId = undefined) {
		this.email = email;
		this.loginCode = loginCode;
		this.teamId = teamId;
		await this.getUsers();
		await this.validateByLoginCode();
		if (!this.user) {
			throw this.lastError;
		}
		return this.user;
	}

	// get the user indicated by the passed email
	async getUsers () {
		// look for all users matching the given email, and check for the first one that succeeds
		this.users = await this.request.data.users.getByQuery(
			{
				searchableEmail: this.email.toLowerCase()
			},
			{
				hint: Indexes.bySearchableEmail
			}
		);

		// if a teamId is given, prioritize the user belonging to that team
		if (this.teamId) {
			const index = this.users.findIndex(user => {
				return (
					user.get('isRegistered') &&
					!user.get('deactivated') &&
					(user.get('teamIds') || []).length === 1 &&
					user.get('teamIds')[0] === this.teamId
				);
			});
			if (index !== -1) {
				const userOnTeam = this.users[index];
				this.users.splice(index, 1);
				this.users.unshift(userOnTeam);
			}
		}
	}

	// find any matching user that is valid according to the password given
	async validateByPassword () {
		for (let user of this.users) {
			if (await this.validatePassword(user)) {
				this.user = user;
				break;
			}
		}
	}

	// validate that the given password matches the password hash stored for the user
	async validatePassword (user) {
		let result;
		try {
			if (
				user.get('isRegistered') &&
				user.get('passwordHash') &&
				!user.get('deactivated')
			) {
				result = await callbackWrap(
					BCrypt.compare,
					this.password,
					user.get('passwordHash')
				);
			}
		}
		catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			this.request.warn(`Error comparing password: ${message}`);
			return false;
		}
		return result;
	}

	// find any matching user that is valid according to the login code given
	async validateByLoginCode () {
		for (let user of this.users) {
			if (await this.validateLoginCode(user)) {
				this.user = user;
				break;
			}
		}
	}

	// validate that the given login code matches the one stored for the user,
	// that it isn't expired, and that the user hasn't tried too many attempts
	async validateLoginCode (user) {
		try {
			if (user.get('loginCodeAttempts') === undefined || parseInt(user.get('loginCodeAttempts'), 10) >= MAX_LOGIN_CODE_ATTEMPTS) {
				throw this.request.errorHandler.error('tooManyLoginCodeAttempts');
			}
			if (!user.get('loginCode') || user.get('loginCode') !== this.loginCode) {
				throw this.request.errorHandler.error('loginCodeMismatch');
			}
			if (!user.get('loginCodeExpiresAt') || Date.now() > user.get('loginCodeExpiresAt')) {
				throw this.request.errorHandler.error('loginCodeExpired');
			}
		} catch (error) {
			const op = {
				$inc: {
					loginCodeAttempts: 1,
				}
			};
			this.request.data.users.updateDirect(
				{ id: this.request.data.users.objectIdSafe(user.id) },
				op
			);
			this.lastError = error;
			return false;
		}
		return true;
	}
}

module.exports = LoginCore;
