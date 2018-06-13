'use strict';

const CheckResetTest = require('./check_reset_test');

class TokenExpiredTest extends CheckResetTest {

	constructor (options) {
		super(options);
		this.expiresIn = 1000; // expire the token after one second
	}

	get description () {
		return 'should return an error when sending a check reset request with an expired token';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1005'
		};
	}

	// before the test runs...
	before (callback) {
		// wait till the token expires...
		super.before(error => {
			if (error) { return callback(error); }
			setTimeout(callback, 2000);
		});
	}
}

module.exports = TokenExpiredTest;
