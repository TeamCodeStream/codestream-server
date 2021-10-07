'use strict';

const JoinCompanyTest = require('./join_company_test');

class ACLTest extends JoinCompanyTest {

	get description () {
		return 'should return an error when a user tries to join a company that allows domain-based joining but their domain does not match';
	}

	getExpectedError () {
		return {
			code: 'TEAM-1003'
		};
	}

	setTestOptions (callback) {
		this.useDomain = this.companyFactory.randomDomain();
		super.setTestOptions(callback);
	}
}

module.exports = ACLTest;
