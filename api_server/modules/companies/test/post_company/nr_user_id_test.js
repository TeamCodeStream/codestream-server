'use strict';

const FirstCompanyOneUserPerOrgTest = require('./first_company_one_user_per_org_test');
const Assert = require('assert');

// we derive this from PostCompanyTest, which tests the behavior when one-user-per-org is not active

class NRUserIdTest extends FirstCompanyOneUserPerOrgTest {

	constructor (options) {
		super(options);
		this.unifiedIdentityEnabled = true;
	}
	
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
				Assert.strictEqual(typeof response.user.nrUserId, 'number', 'nrUserId not set');
				Assert.strictEqual(response.user.nrUserInfo.userTier, 'full_user_tier', 'user tier not set');
				Assert.strictEqual(response.user.nrUserInfo.userTierId, 0, 'user tier ID not set');
				callback();
			}
		)
	}
}

module.exports = NRUserIdTest;
