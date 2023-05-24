'use strict';

const EligibleJoinCompaniesTest = require('./eligible_join_companies_test');

class DomainOrEmailRequiredTest extends EligibleJoinCompaniesTest {

	get description () {
		return 'should return an error when submitting a request to fetch cross-environment eligible join companies without providing email';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'email'
		};
	}

	// before the test runs...
	before (callback) {
		// set the path without the domain parameter
		super.before(error => {
			if (error) { return callback(error); }
			this.path = '/xenv/eligible-join-companies';
			callback();
		});
	}
}

module.exports = DomainOrEmailRequiredTest;
