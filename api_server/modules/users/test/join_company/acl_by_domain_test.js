'use strict';

const JoinCompanyTest = require('./join_company_test');

class ACLByDomainTest extends JoinCompanyTest {

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
		this.byDomainJoining = true;
		super.setTestOptions(callback);
	}
}

module.exports = ACLByDomainTest;
