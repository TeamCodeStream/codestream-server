'use strict';

const RefreshTokenFetchTest = require('./refresh_token_fetch_test');
const Assert = require('assert');

class RefreshTokenBehindSGFetchTest extends RefreshTokenFetchTest {

	constructor (options) {
		super(options);
		this.serviceGatewayEnabled = true;
	}
	
	get description () {
		return 'under Unified Identity, and running behind Service Gateway, current user should get an updated New Relic access token, after creating a new org, checked by doing a login and checking the user record';
	}

	validateResponse (data) {
		const { user, accessToken } = data;
		const teamId = this.createCompanyResponse.teamId || this.loginResponse.teams[0].id;
		const nrToken = user.providerInfo[teamId].newrelic.accessToken;
		Assert.strictEqual(accessToken, nrToken, 'CodeStream access token not equal to New Relic access token');

		const originalToken = this.loginResponse.accessToken;
		Assert(accessToken.startsWith('MNRI-'), 'CS access token should be an NR access token');
		Assert.notStrictEqual(originalToken, accessToken, 'access token on fetch is the same as the one originally issued');
		return super.validateResponse(data);
	}
}

module.exports = RefreshTokenBehindSGFetchTest;
