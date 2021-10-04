'use strict';

const ValidateEmailTest = require('./validate_email_test');

class NoIdeTest extends ValidateEmailTest {

	get description () {
		return 'should return valid paylaod with protocolHandling set to false when sending a validate email request for a user who has no lastOrigin set';
	}

	// before the test runs...
	before (callback) {
		this.noIDE = true;
		super.before(error => {
			if (error) { return callback(error); }
			Object.assign(this.expectedResponse.payload, {
				protocolHandling: false,
				ide: ''
			});
			callback();
		});
	}
}

module.exports = NoIdeTest;
