// can remove this test when we have fully moved to ONE_USER_PER_ORG

'use strict';

const JoinCompanyTest = require('./join_company_test');

class OneUserPerOrgEnabledTest extends JoinCompanyTest {

	get description () {
		return 'should return an error when trying to join a company while one-user-per-org is not enabled';
	}

	getExpectedError () {
		return {
			code: 'TEAM-1003',
			reason: 'one-user-per-org not enabled'
		};
	}

	setTestOptions (callback) {
		super.setTestOptions(error => {
			if (error) { return callback(error); }
			//this.oneUserPerOrg = false;
			callback();
		});
	}
}

module.exports = OneUserPerOrgEnabledTest;
