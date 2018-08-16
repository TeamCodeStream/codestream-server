'use strict';

const ChangeEmailTest = require('./change_email_test');

class EmailRequiredTest extends ChangeEmailTest {

	get description () {
		return 'should return an error when submitting a request to change email without providing a new email';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: this.parameter
		};
	}

	// before the test runs...
	before (callback) {
		// delete the email from the data to submit with the request
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data.email;
			callback();
		});
	}
}

module.exports = EmailRequiredTest;
