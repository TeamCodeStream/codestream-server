'use strict';

const EligibleJoinCompaniesTest = require('./eligible_join_companies_test');

class DomainOrEmailRequiredTest extends EligibleJoinCompaniesTest {

	get description () {
		// remove this check and rename the test when we have fully moved to ONE_USER_PER_ORG
		const parameter = 'email';
		return `should return an error when submitting a request to fetch cross-environment eligible join companies without providing ${parameter}`;
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
