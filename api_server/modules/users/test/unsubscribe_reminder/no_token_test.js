'use strict';

const UnsubscribeTest = require('./unsubscribe_test');
const Assert = require('assert');

class NoTokenTest extends UnsubscribeTest {

	get description () {
		return 'should redirect to an error page when trying to unsubscribe from reminder emails by clicking an email link, but not providing a token';
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			// change path to have no token
			this.path = '/no-auth/unsubscribe-reminder';
			callback();
		});
	}

	validateResponse (data) {
		Assert.strictEqual(data, '/web/unsubscribe-reminder-error?error=AUTH-1001', 'improper redirect');
	}
}

module.exports = NoTokenTest;
