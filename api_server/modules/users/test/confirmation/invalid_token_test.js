'use strict';

var ConfirmationWithLinkTest = require('./confirmation_with_link_test');

class InvalidTokenTest extends ConfirmationWithLinkTest {

	get description () {
		return 'should return an error when trying to confirm with a bad confirmation token';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1002'
		};
	}

	// before the test runs...
	before (callback) {
		// run the standard setup for a confirmation, but replace the token
		super.before(error => {
			if (error) { return callback(error); }
			this.data.token = 'abcxyz';
			callback();
		});
	}
}

module.exports = InvalidTokenTest;
