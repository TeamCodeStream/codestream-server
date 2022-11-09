'use strict';

const JoinCompanyTest = require('./join_company_test');

class DeprecatedTest extends JoinCompanyTest {

	get description () {
		return 'should return an error indicating endpoint is deprecated when attempting to join a company before one-user-per-org';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1016'
		};
	}
}

module.exports = DeprecatedTest;
