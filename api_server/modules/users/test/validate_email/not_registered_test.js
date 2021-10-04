'use strict';

const ValidateEmailTest = require('./validate_email_test');

class NotRegisteredTest extends ValidateEmailTest {

	get description () {
		return 'should return an error in payload when sending a validate email request for a user that has not yet confirmed';
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.email = this.users[2].user.email;
			this.expectedErrorCode = 'USRC-1010';
			callback();
		});
	}
}

module.exports = NotRegisteredTest;
