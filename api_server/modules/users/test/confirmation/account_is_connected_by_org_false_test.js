'use strict';

const InitialDataTest = require('./initial_data_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class AccountIsConnectedByOrgFalseTest extends InitialDataTest {

	get description () {
		return 'user should get a flag indicating their NR account is not connected to a company with response to email confirmation, when account ID is sent which matches a known org ID but no matching company is found';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.addNROrg
		], callback);
	}

	// add an accout to org mapping
	async addNROrg (callback) {
		this.accountId = this.codeErrorFactory.randomAccountId();
		this.orgId = this.codeErrorFactory.randomOrgId();
		this.data.nrAccountId = this.accountId;
		this.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/add-nr-org',
				data: {
					accountId: this.accountId,
					orgId: this.orgId
				},
				requestOptions: {
					headers: {
						'X-CS-NewRelic-Secret': this.apiConfig.sharedSecrets.commentEngine,
						'X-CS-NewRelic-AccountId': this.accountId
					}
				}
			},
			callback
		);
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert.strictEqual(data.accountIsConnected, false, 'accountIsConnected should be false');
		super.validateResponse(data);
	}
}

module.exports = AccountIsConnectedByOrgFalseTest;
