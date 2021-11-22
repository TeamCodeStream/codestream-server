'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class LookupNROrgsTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		delete this.teamOptions.creatorIndex;
	}

	get description () {
		return 'should return New Relic orgs matched by account ID when requested';
	}

	get method () {
		return 'post';
	}

	get path () {
		return '/lookup-nr-orgs';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createNROrgInfo
		], callback);
	}

	// create some NR org info using a secret request
	createNROrgInfo (callback) {
		this.accountIds = [];
		this.data = {
			accountIds: []
		};
		this.expectedData = [];
		BoundAsync.timesSeries(
			this,
			8,
			this.createNROrgRecord,
			callback
		);
	}

	// create a single NR org record using a secret request
	createNROrgRecord (n, callback) {
		const accountId = (n % 2 == 1) ? this.accountIds[n - 1] : this.codeErrorFactory.randomAccountId();
		this.accountIds.push(accountId);
		const orgId = this.codeErrorFactory.randomOrgId();
		if (n < 6) {
			if (n % 2 === 0) {
				this.data.accountIds.push(accountId);
			}
			this.expectedData.push({ accountId, orgId });
		}
		const data = { accountId, orgId };
		this.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/add-nr-org',
				data,
				token: this.users[1].accessToken,
				requestOptions: {
					headers: {
						'X-CS-NewRelic-Secret': this.apiConfig.sharedSecrets.commentEngine,
						'X-CS-NewRelic-AccountId': data.accountId
					}
				}
			},
			callback
		);
	}

	// validate the request response
	validateResponse (data) {
		data.sort((a, b) => {
			return a.orgId.localeCompare(b.orgId);
		});
		this.expectedData.sort((a, b) => {
			return a.orgId.localeCompare(b.orgId);
		});
		Assert.deepStrictEqual(data, this.expectedData, 'response data is incorrect');
	}
}

module.exports = LookupNROrgsTest;
