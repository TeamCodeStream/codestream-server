'use strict';

const JoinCompanyTest = require('./join_company_test');

class ACLTest extends JoinCompanyTest {

	get description () {
		return 'should return an error when a user tries to join a company that they have not been invited to';
	}

	getExpectedError () {
		return {
			code: 'TEAM-1003'
		};
	}

	setTestOptions (callback) {
		this.dontInvite = true;
		super.setTestOptions(callback);
	}
}

module.exports = ACLTest;
