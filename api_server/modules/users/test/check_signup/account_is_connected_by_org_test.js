'use strict';

const NoTeamsTest = require('./no_teams_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class AccountIsConnectedByOrgTest extends NoTeamsTest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 1;
		this.teamOptions.creatorIndex = 0;
	}

	get description () {
		return 'user should get a flag indicating their NR account is connected to a company with response to check signup, when a match to the given account ID found via org ID lookup';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.addNROrg,
			this.addNRInfo,
		], callback);
	}

	// add an accout to org mapping
	addNROrg (callback) {
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
	addNRInfo (callback) {
		this.data.nrAccountId = this.accountId;
		this.doApiRequest(
			{
				method: 'post',
				path: '/companies/add-nr-info/' + this.company.id,
				data: {
					orgIds: [this.orgId]
				},
				token: this.users[0].accessToken
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
