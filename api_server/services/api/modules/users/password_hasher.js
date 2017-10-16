'use strict';

var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var BCrypt = require('bcrypt');

class Password_Hasher  {

	constructor (options) {
		Object.assign(this, options);
	}

	hash_password (callback) {
		Bound_Async.series(this, [
			this.generate_salt,
			this.encrypt_password
		], (error) => {
			callback(error, this.password_hash);
		});
	}

	generate_salt (callback) {
		BCrypt.genSalt(
			10,
			(error, salt) => {
				if (error) {
					return callback(this.error_handler.error('token', { reason: error }));
				}
				this.salt = salt;
				process.nextTick(callback);
			}
		);
	}

	encrypt_password (callback) {
		BCrypt.hash(
			this.password,
			this.salt,
			(error, password_hash) => {
				if (error) {
					return callback(this.error_handler.error('token', { reason: error }));
				}
				this.password_hash = password_hash;
				process.nextTick(callback);
			}
		);
	}
}

module.exports = Password_Hasher;
