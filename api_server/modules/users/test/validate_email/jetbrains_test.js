'use strict';

const ValidateEmailTest = require('./validate_email_test');

class JetBrainsTest extends ValidateEmailTest {

	get description () {
		return 'should return valid paylaod when sending a validate email request for a user who has lastOrigin set to JetBrains';
	}

	// before the test runs...
	before (callback) {
		this.useIDE = 'JetBrains';
		super.before(error => {
			if (error) { return callback(error); }
			this.expectedResponse.payload.ide = 'jetbrains';
			callback();
		});
	}
}

module.exports = JetBrainsTest;
