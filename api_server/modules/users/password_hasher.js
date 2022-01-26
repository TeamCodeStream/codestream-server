// handles hashing a user's password

'use strict';

const BCrypt = require('bcrypt');
const { callbackWrap } = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/await_utils');

class PasswordHasher  {

	constructor (options) {
		Object.assign(this, options);
	}

	async hashPassword () {
		await this.generateSalt();
		await this.encryptPassword();
		return this.passwordHash;
	}

	async generateSalt () {
		try {
			this.salt = await callbackWrap(BCrypt.genSalt, 10);
		}
		catch (error) {
			if (this.errorHandler) {
				const message = typeof error === 'object' ? error.message : JSON.stringify(error);
				throw this.errorHandler.error('token', { reason: message });
			} else {
				throw error;
			}
		}
	}

	async encryptPassword () {
		try {
			this.passwordHash = await callbackWrap(
				BCrypt.hash,
				this.password,
				this.salt
			);
		}
		catch (error) {
			if (this.errorHandler) {
				const message = typeof error === 'object' ? error.message : JSON.stringify(error);
				throw this.errorHandler.error('token', { reason: message });
			} else {
				throw error;
			}
		}
	}
}

module.exports = PasswordHasher;
