'use strict';

const FirstCompanyOneUserPerOrgTest = require('./first_company_one_user_per_org_test');
const Assert = require('assert');

// we derive this from PostCompanyTest, which tests the behavior when one-user-per-org is not active
// when we fully move to ONE_USER_PER_ORG, the structure here might need to change

class NRUserIdTest extends FirstCompanyOneUserPerOrgTest {

	get description () {
		return 'when a user creates their first company, they should be provisioned on New Relic, and given a New Relic user id';
	}

	run (callback) {
		super.run(error => {
			if (error) { return callback(error); }
			this.confirmNRUserId(callback);
		});
	}

	confirmNRUserId (callback) {
		this.doApiRequest(
			{
				method: 'get',
				path: '/users/me',
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				Assert.strictEqual(typeof response.user.nrUserId, 'string', 'nrUserId not set');
				callback();
			}
		)
	}
}

module.exports = NRUserIdTest;
