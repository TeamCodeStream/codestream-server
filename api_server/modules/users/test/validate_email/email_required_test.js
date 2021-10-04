'use strict';

const ValidateEmailTest = require('./validate_email_test');

class EmailRequiredTest extends ValidateEmailTest {

	get description () {
		return 'should return an error when sending a validate email request with no email';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'email'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data.email;
			callback();
		});
	}
}

module.exports = EmailRequiredTest;
