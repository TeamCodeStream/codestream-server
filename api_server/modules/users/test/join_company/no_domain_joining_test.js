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

	setTestOptions (callback) {
		this.byDomainJoining = false;
		this.dontInvite = true;
		super.setTestOptions(callback);
	}
}

module.exports = NoDomainJoiningTest;
