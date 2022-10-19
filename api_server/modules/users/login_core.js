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
			if (this.lastError) {
				throw this.lastError;
			} else {
				throw this.errorHandler.error('notFound');
			}
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

		// if we have a teamId, look only for the user that matches that teamId
		// otherwise if we have a login code, look for any user that matches that login code,
		// but if none is found, use the first registered user
		// otherwise if we are validating by password, we'll check against any and all
		// registered users to a match to the password
		let firstRegisteredUser;
		this.users = this.users.filter(user => {
			if (!user.get('isRegistered') || user.get('deactivated')) {
				return false;
			}

			const teamIds = user.get('teamIds') || [];
			if (this.teamId) {
				return teamIds.length === 1 && teamIds[0] === this.teamId;
			} else if (this.loginCode) {
				if (user.get('loginCode') === this.loginCode) {
					return true;
				} else {
					firstRegisteredUser = user;
				}
			} else {
				return true;
			}
		});

		if (this.loginCode && this.users.length === 0 && firstRegisteredUser) {
			this.users = [firstRegisteredUser];
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
			if (user.get('loginCodeAttempts') >= MAX_LOGIN_CODE_ATTEMPTS) {
				throw this.request.errorHandler.error('tooManyLoginCodeAttempts');
			}
			else if (!user.get('loginCode') || user.get('loginCode') !== this.loginCode) {
				throw this.request.errorHandler.error('loginCodeMismatch');
			}
			else if (!user.get('loginCodeExpiresAt') || Date.now() > user.get('loginCodeExpiresAt')) {
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
