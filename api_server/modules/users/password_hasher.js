// handles hashing a user's password

'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var BCrypt = require('bcrypt');

class PasswordHasher  {

	constructor (options) {
		Object.assign(this, options);
	}

	hashPassword (callback) {
		BoundAsync.series(this, [
			this.generateSalt,
			this.encryptPassword
		], (error) => {
			callback(error, this.passwordHash);
		});
	}

	generateSalt (callback) {
		BCrypt.genSalt(
			10,
			(error, salt) => {
				if (error) {
					return callback(this.errorHandler.error('token', { reason: error }));
				}
				this.salt = salt;
				process.nextTick(callback);
			}
		);
	}

	encryptPassword (callback) {
		BCrypt.hash(
			this.password,
			this.salt,
			(error, passwordHash) => {
				if (error) {
					return callback(this.errorHandler.error('token', { reason: error }));
				}
				this.passwordHash = passwordHash;
				process.nextTick(callback);
			}
		);
	}
}

module.exports = PasswordHasher;
