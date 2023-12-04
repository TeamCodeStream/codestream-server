'use strict';

const NewRelicRefreshTest = require('./newrelic_refresh_test');
const Assert = require('assert');
const NewRelicIDPConstants = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/newrelic_idp/newrelic_idp_constants');

class FetchTest extends NewRelicRefreshTest {

	get description () {
		const type = this.wantIDToken ? 'id' : 'access';
		return `should properly update the user\'s ${type} token when manually refreshed, checked by checking the user`;
	}

	run (callback) {
		super.run(error => {
			if (error) { return callback(error); }
			this.doApiRequest(
				{
					method: 'put',
					path: '/login',
					token: this.signupResponse.accessToken
				},
				(error, response) => {
					if (error) { return callback(error); }
					this.validateLogin(response);
					callback();
				}
			);
		});
	}

	validateLogin (data) {
		const { user } = data;
		const teamId = this.signupResponse.teams[0].id;
		const providerInfo = user.providerInfo[teamId].newrelic;
		const expectedProviderInfo = {
			accessToken: this.refreshResponse.accessToken,
			refreshToken: this.refreshResponse.refreshToken,
			bearerToken: true,
			expiresAt: this.refreshResponse.expiresAt,
			provider: NewRelicIDPConstants.NR_AZURE_LOGIN_POLICY,
			tokenType: this.wantIDToken ? 'id' : 'access'
		};
		Assert.deepStrictEqual(providerInfo, expectedProviderInfo, 'providerInfo not correct');
		Assert.strictEqual(data.accessToken, this.refreshResponse.accessToken, 'accessToken not correct');
		const expectedTokenInfo = {
			refreshToken: this.refreshResponse.refreshToken,
			expiresAt: this.refreshResponse.expiresAt,
			provider: NewRelicIDPConstants.NR_AZURE_LOGIN_POLICY,
			isNRToken: true,
			tokenType: this.wantIDToken ? 'id' : 'access'
		};
		Assert.deepStrictEqual(data.accessTokenInfo, expectedTokenInfo, 'tokenInfo not correct');
	}
}

module.exports = FetchTest;
