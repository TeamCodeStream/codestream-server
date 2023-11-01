'use strict';

const NewRelicRefreshTest = require('./newrelic_refresh_test');
const Assert = require('assert');

class FetchTest extends NewRelicRefreshTest {

	get description () {
		return 'should properly update the user\'s access token when manually refreshed, checked by checking the user';
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
			provider: 'azureb2c-cs'
		};
		Assert.deepStrictEqual(providerInfo, expectedProviderInfo, 'providerInfo not correct');
		Assert.strictEqual(data.accessToken, this.refreshResponse.accessToken, 'accessToken not correct');
		const expectedTokenInfo = {
			refreshToken: this.refreshResponse.refreshToken,
			expiresAt: this.refreshResponse.expiresAt,
			provider: 'azureb2c-cs',
			isNRToken: true
		};
		Assert.deepStrictEqual(data.accessTokenInfo, expectedTokenInfo, 'tokenInfo not correct');
	}
}

module.exports = FetchTest;
