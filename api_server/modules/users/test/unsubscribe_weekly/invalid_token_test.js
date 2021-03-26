'use strict';

const UnsubscribeTest = require('./unsubscribe_test');
const Assert = require('assert');

class InvalidTokenTest extends UnsubscribeTest {

	get description () {
		return 'should redirect to an error page when trying to unsubscribe from weekly emails by clicking an email link, providing an invalid token';
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			// change path to include an invalid token
			this.path = '/no-auth/unsubscribe-weekly?t=x';
			callback();
		});
	}

	validateResponse (data) {
		Assert.strictEqual(data, '/web/unsubscribe-weekly-error?error=AUTH-1002', 'improper redirect');
	}
}

module.exports = InvalidTokenTest;
