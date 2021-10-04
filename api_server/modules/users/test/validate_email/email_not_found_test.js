'use strict';

const ValidateEmailTest = require('./validate_email_test');

class EmailNotFoundTest extends ValidateEmailTest {

	get description () {
		return 'should return an error in payload when sending a validate email request for a non-existent email';
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.email = this.userFactory.randomEmail();
			this.expectedErrorCode = 'RAPI-1003';
			callback();
		});
	}
}

module.exports = EmailNotFoundTest;
