'use strict';

const ChangeEmailTest = require('./change_email_test');

class ToEmailRequiredTest extends ChangeEmailTest {

	get description () {
		return 'should return an error when submitting a request to change a user\'s email across environments without providing a to-email';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'toEmail'
		};
	}

	// before the test runs...
	before (callback) {
		// delete the email from the request body
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data.toEmail;
			callback();
		});
	}
}

module.exports = ToEmailRequiredTest;
