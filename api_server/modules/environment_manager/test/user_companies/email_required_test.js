'use strict';

const UserCompaniesTest = require('./user_companies_test');

class EmailRequiredTest extends UserCompaniesTest {

	get description () {
		return 'should return an error when submitting a request to fetch cross-environment companies without providing an email';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'email'
		};
	}

	// before the test runs...
	before (callback) {
		// set the path without the email parameter
		super.before(error => {
			if (error) { return callback(error); }
			this.path = '/xenv/user-companies';
			callback();
		});
	}
}

module.exports = EmailRequiredTest;
