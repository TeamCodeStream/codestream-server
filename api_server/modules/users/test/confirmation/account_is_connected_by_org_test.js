'use strict';

const InitialDataTest = require('./initial_data_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class AccountIsConnectedByOrgTest extends InitialDataTest {

	get description () {
		return 'user should get a flag indicating their NR account is connected to a company with response to email confirmation, when a match to the given account ID found via org ID lookup';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.addNROrg,
			this.addNRInfo,
		], callback);
	}

	// add an accout to org mapping
	async addNROrg (callback) {
		this.accountId = this.codeErrorFactory.randomAccountId();
		this.orgId = this.codeErrorFactory.randomOrgId();
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

	// add info to the company indicating it is connected to a New Relic accont
	async addNRInfo (callback) {
		this.data.nrAccountId = this.accountId;
		this.doApiRequest(
			{
				method: 'post',
				path: '/companies/add-nr-info/' + this.company.id,
				data: {
					orgIds: [this.orgId]
				},
				token: this.users[1].accessToken
			},
			callback
		);
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert.strictEqual(data.accountIsConnected, true, 'accountIsConnected should be true');
		super.validateResponse(data);
	}
}

module.exports = AccountIsConnectedByOrgTest;
