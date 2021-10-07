'use strict';

const JoinCompanyTest = require('./join_company_test');

class NoDomainJoiningTest extends JoinCompanyTest {

	get description () {
		return 'should return an error when a user tries to join a company that does not allow domain-based joining';
	}

	getExpectedError () {
		return {
			code: 'TEAM-1003'
		};
	}

	// override the method to enable domain-based joining; do nothing instead
	enableDomainJoining (callback) {
		callback();
	}
}

module.exports = NoDomainJoiningTest;
