'use strict';

const ConfirmationWithLinkTest = require('./confirmation_with_link_test');

class TokenExpiredTest extends ConfirmationWithLinkTest {

	constructor (options) {
		super(options);
		this.userOptions.expiresIn = 1000; // expire the token after one second
	}

	get description () {
		return 'should return an error when trying to confirm with an expired token';
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
