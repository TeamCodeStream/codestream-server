'use strict';

const IDPSignupTest = require('./idp_signup_test');
const Assert = require('assert');
const NewRelicIDPConstants = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/newrelic_idp/newrelic_idp_constants');

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
		Assert(accessTokenInfo.refreshToken.startsWith('MNRRI-'), 'user does not have a mock NR refresh token');
		Assert(accessTokenInfo.expiresAt >= Date.now(), 'user does not have an expiredAt with their access token that expires in the future');
		Assert.strictEqual(accessTokenInfo.provider, NewRelicIDPConstants.NR_AZURE_PASSWORD_POLICY, 'user does not have NR provider set to proper password policy');
		Assert.strictEqual(accessTokenInfo.isNRToken, true, 'user does not have isNRToken set');
  
		super.validateResponse(data);
	}
}

module.exports = IDPSignupBehindSGTest;
