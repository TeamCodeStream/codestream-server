'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const NRLoginCommonInit = require('./nrlogin_common_init');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class NRLoginTest extends Aggregation(CodeStreamAPITest, NRLoginCommonInit) {

	get description () {
		let desc = 'should create a user and set an access token for the user when completing a New Relic authorization flow';
		if (this.serviceGatewayEnabled) {
			desc += ', and set CodeStream access token with Service Gateway auth enabled';
		}
		return desc;
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			CodeStreamAPITest.prototype.before.bind(this),
			this.init
		], callback);
	}

	// validate the response to the test request
	validateResponse (data) {
		if (this.wantError) {
			return this.validateErrorResponse();
		}

		// verify we were redirected to auth-complete page at the end of the flow
		Assert([301, 302].indexOf(this.providerTokenResponse.statusCode) >= 0, 'call to provider-token should have redirected');
		Assert(this.providerTokenData.match('/web/signed-in'), 'call to provider-token should have redirected to web/signed-in page');

		// verify that the correct provider info made its way into the user object created
		const { user } = data;
		const teamId = this.team ? this.team.id : this.signupResponse.teams[0].id;
		const providerInfo = user.providerInfo[teamId].newrelic;
		const expectedProviderInfo = {
			accessToken: JSON.stringify(this.mockUser),
			bearerToken: true,
			refreshToken: 'placeholder',
			expiresAt: Date.now(),
			provider: 'azureb2c-cs'
		};
		Assert(typeof providerInfo.refreshToken === 'string', 'no refreshToken in providerInfo');
		Assert(providerInfo.expiresAt > Date.now(), 'expiresAt not in the future');
		expectedProviderInfo.expiresAt = providerInfo.expiresAt;
		expectedProviderInfo.refreshToken = providerInfo.refreshToken;
		Assert.deepStrictEqual(providerInfo, expectedProviderInfo, 'providerInfo not correct');
		Assert.strictEqual(user.nrUserId, parseInt(this.nrUserId, 10), 'provider userId does not match expected userId');

		if (this.serviceGatewayEnabled) {
			const { accessToken, accessTokenInfo } = this.signupResponse;
			const { refreshToken, expiresAt, provider, isNRToken } = accessTokenInfo;
			Assert.strictEqual(accessToken, providerInfo.accessToken, 'CodeStream access token not set to the NR access token');
			Assert.strictEqual(refreshToken, providerInfo.refreshToken, 'CodeStream refresh token not set to the NR refresh token');
			Assert.strictEqual(expiresAt, providerInfo.expiresAt, 'CodeStream access token expiresAt not set to the NR expiresAt');
			Assert.strictEqual(provider, 'azureb2c-cs', 'CodeStream access token provider not correct');
			Assert.strictEqual(isNRToken, true, 'CodeStream access token isNRToken not set to true');
		}
	}

	validateErrorResponse () {
		Assert.strictEqual(this.providerTokenData, `/web/error?state=0&code=${this.wantError}&provider=newrelicidp`, 'redirect url not correct');
		Assert([301, 302].indexOf(this.providerTokenResponse.statusCode) >= 0, 'call to ~nrlogin should have redirected');
		Assert.strictEqual(this.signupError.code, 'USRC-1022', 'incorrect signup token error code');
		Assert.strictEqual(this.signupError.error, this.wantError, 'incorrect error code');
		Assert.strictEqual(this.signupError.provider, 'newrelicidp', 'incorrect provider in error info');
	}
}

module.exports = NRLoginTest;
