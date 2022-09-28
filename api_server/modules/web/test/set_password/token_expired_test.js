'use strict';

const ErrorTest = require('./error_test');

class TokenExpiredTest extends ErrorTest {

	constructor (options) {
		super(options);
		this.expiresIn = 1000; // expire the token after one second
	}

	get description () {
		return 'should redirect to an error page when setting a password with an expired token';
	}

	before (callback) {
		super.before (error => {
			if (error) { return callback(error); }
			setTimeout(callback, 2000);
		});
	}
}

module.exports = TokenExpiredTest;
