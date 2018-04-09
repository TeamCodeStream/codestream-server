// handles hashing a user's password

'use strict';

const BCrypt = require('bcrypt');
const { callbackWrap } = require(process.env.CS_API_TOP + '/server_utils/await_utils');

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
			const message = typeof error === 'object' ? error.message : JSON.stringify(error);
			throw this.errorHandler.error('token', { reason: message });
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
			const message = typeof error === 'object' ? error.message : JSON.stringify(error);
			throw this.errorHandler.error('token', { reason: message });
		}
	}
}

module.exports = PasswordHasher;
