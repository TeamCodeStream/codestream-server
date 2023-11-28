'use strict';

const FirstCompanyOneUserPerOrgTest = require('./first_company_one_user_per_org_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const NewRelicIDPConstants = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/newrelic_idp/newrelic_idp_constants');

// we derive this from PostCompanyTest, which tests the behavior when one-user-per-org is not active

class IDPSignupTest extends FirstCompanyOneUserPerOrgTest {

	constructor (options) {
		super(options);
		this.unifiedIdentityEnabled = true;
	}
	
	get description () {
		return 'when a user creates their first company, they should be provisioned on New Relic, and given New Relic credentials';
	}

	get method () {
		return 'put';
	}

	before (callback) {
		this.path = '/users/me';
		BoundAsync.series(this, [
			super.before,
			this.setPath,
			this.createCompany,
			this.waitForRefresh
		], callback);
	}

	setPath (callback) {
		this.path = '/login';
		callback();
	}

	waitForRefresh (callback) {
		const time = this.mockMode ? 2000 : 12000;
		setTimeout(callback, time);
	}

	validateResponse (data) {
		const { user } = data;

		Assert.strictEqual(typeof user.nrUserId, 'number', 'nrUserId not set');
		Assert.strictEqual(user.nrUserInfo.userTier, 'full_user_tier', 'user tier not set');
		Assert.strictEqual(user.nrUserInfo.userTierId, 0, 'user tier ID not set');

		const teamId = this.createCompanyResponse.team.id;
		const nrProviderInfo = user.providerInfo[teamId].newrelic;
		Assert(nrProviderInfo.accessToken.startsWith('MNRI-'), 'user does not have a mock NR access token');
		Assert(nrProviderInfo.refreshToken.startsWith('MNRRI-'), 'user does not have a mock NR refresh token');
		Assert(nrProviderInfo.expiresAt >= Date.now(), 'user does not have an expiredAt with their access token that expires in the future');
		Assert(nrProviderInfo.bearerToken === true, 'user does not have a bearerToken flag for their NR access token');
		Assert.strictEqual(nrProviderInfo.provider, NewRelicIDPConstants.NR_AZURE_PASSWORD_POLICY, 'user does not have NR provider set to the correct password policy');

		Assert.strictEqual(user.preferences.hasDoneNRLogin, true, 'preferences.hasDoneNRLogin not set to true');
	}
}

module.exports = IDPSignupTest;
