'use strict';

const PostCompanyTest = require('./post_company_test');

// we derive this from PostCompanyTest, which tests the behavior when one-user-per-org is not active
// when we fully move to ONE_USER_PER_ORG, the structure here might need to change

class FirstCompanyOneUserPerOrgTest extends PostCompanyTest {

	constructor (options) {
		super(options);
		this.oneUserPerOrg = true; // ONE_USER_PER_ORG
		delete this.teamOptions.creatorIndex;
	}

	get description () {
		return 'when a user creates their first company, even under one-user-per-org, the full company info should be returned';
	}
}

module.exports = FirstCompanyOneUserPerOrgTest;
