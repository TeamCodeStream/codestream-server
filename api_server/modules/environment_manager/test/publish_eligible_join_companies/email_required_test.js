'use strict';

const PublishEligibleJoinCompaniesTest = require('./publish_eligible_join_companies_test');

class EmailRequiredTest extends PublishEligibleJoinCompaniesTest {

	get description () {
		return 'should return an error when submitting a cross-environment request to publish eligible join companies without an email';
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
