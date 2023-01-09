'use strict';

const UserCompaniesTest = require('./user_companies_test');

class DeprecatedTest extends UserCompaniesTest {

	get description () {
		return 'should return an error indicating request is deprecated when making a request to fetch foreign companies for a user, this functionality is deprecated for one-user-per-org';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1016'
		};
	}
}

module.exports = DeprecatedTest;
