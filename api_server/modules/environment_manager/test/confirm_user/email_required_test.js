'use strict';

const ConfirmUserTest = require('./confirm_user_test');

class EmailRequiredTest extends ConfirmUserTest {

	get description () {
		return 'should return an error when submitting a request to confirm a user without providing an email';
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
