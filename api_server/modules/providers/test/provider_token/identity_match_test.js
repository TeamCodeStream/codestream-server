'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const IdentityMatchCommonInit = require('./identity_match_common_init');
const Assert = require('assert');

class IdentityMatchTest extends Aggregation(CodeStreamAPITest, IdentityMatchCommonInit) {

	get description () {
		return `should create a team and user and set an access token for the user when completing an authorization flow for ${this.provider}`;
	}

	// before the test runs...
	before (callback) {
		this.init(callback);
	}

	// validate the response to the test request
	validateResponse (data) {
		// verify we were redirected to auth-complete page at the end of the flow
		Assert([301, 302].indexOf(this.providerTokenResponse.statusCode) >= 0, 'call to provider-token should have redirected');
		Assert(this.providerTokenData.match(`\\/web\\/provider-auth-complete\\/${this.provider}`), 'call to provider-token should have redirected to provider-auth-complete page');

		// verify that the correct provider info made its way into the user object created
		const { user } = data;
		const expectedProviderIdentities = [ `${this.provider}::${this.providerUserId}` ];
		Assert.deepEqual(user.providerIdentities, expectedProviderIdentities, 'providerIdentities not connect');
		const providerInfo = user.providerInfo[this.provider];
		Assert.equal(providerInfo.userId, this.providerUserId, 'provider userId does not match expected userId');
	}
}

module.exports = IdentityMatchTest;
