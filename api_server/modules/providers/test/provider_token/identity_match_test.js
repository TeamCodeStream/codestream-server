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
		const teamId = this.signupResponse.teams[0].id;
		const providerInfo = user.providerInfo[teamId][this.provider];
		Assert.equal(providerInfo.userId, this.providerUserId, 'provider userId does not match expected userId');
		Assert.equal(providerInfo.teamId, this.providerTeamId, 'provider teamId does not match expected teamId');

		// verify that the correct provider info made its way into the team object created
		const expectedTeamProviderInfo = {
			[this.provider]: {
				teamId: this.providerTeamId
			}
		};
		Assert.deepEqual(this.signupResponse.teams[0].providerInfo, expectedTeamProviderInfo, 'team providerInfo not correct');
	}
}

module.exports = IdentityMatchTest;
