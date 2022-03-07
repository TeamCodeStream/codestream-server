'use strict';

const ChangeEmailTest = require('./change_email_test');

class EmailRequiredTest extends ChangeEmailTest {

	get description () {
		return 'should return an error when submitting a request to change a user\'s email across environments without providing an email';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'email'
		};
	}

	// before the test runs...
	before (callback) {
		// delete the email from the request body
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data.email;
			callback();
		});
	}
}

module.exports = EmailRequiredTest;
