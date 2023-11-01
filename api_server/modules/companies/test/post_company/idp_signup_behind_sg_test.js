'use strict';

const IDPSignupTest = require('./idp_signup_test');
const Assert = require('assert');

class IDPSignupBehindSGTest extends IDPSignupTest {

	constructor (options) {
		super(options);
		this.serviceGatewayEnabled = true;
	}
	
	get description () {
		return 'when a user creates their first company, and we are running behind Service Gateway, they should be provisioned on New Relic, and given New Relic credentials for CodeStream access token';
	}

	validateResponse (data) {
		const { accessToken, accessTokenInfo } = data;

		Assert(accessToken.startsWith('MNRI-'), 'user does not have a mock NR access token for CS access token');
		Assert(accessTokenInfo.refreshToken.startsWith('MNRR-'), 'user does not have a mock NR refresh token');
		Assert(accessTokenInfo.expiresAt >= Date.now(), 'user does not have an expiredAt with their access token that expires in the future');
		Assert.strictEqual(accessTokenInfo.provider, 'azureb2c-csropc', 'user does not have NR provider set to azureb2c-csropc');
		Assert.strictEqual(accessTokenInfo.isNRToken, true, 'user does not have isNRToken set');
  
		super.validateResponse(data);
	}
}

module.exports = IDPSignupBehindSGTest;
