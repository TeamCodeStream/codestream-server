'use strict';

const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const UserTestConstants = require('../user_test_constants');

class LoginByCodeTest extends CodeStreamAPITest {

	get description () {
		return 'should return valid user data when logging in by code';
	}

	get method () {
		return 'put';
	}

	get path () {
		return '/no-auth/login-by-code';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.generateLoginCode
		], callback);
	}

	generateLoginCode (callback) {
		this.beforeLogin = Date.now();
		// ensure we have a login code generated to test
		const data = {
			email: this.currentUser.user.email,
			_loginCheat: this.apiConfig.sharedSecrets.confirmationCheat
		};
		this.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/generate-login-code',
				data: data
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.data = {
					email: this.currentUser.user.email,
					loginCode: response.loginCode
				};
				callback();
			}
		);
	}

	// validate the response to the test request
	validateResponse (data) {
		// validate we get back the expected user, an access token, and a pubnub subscription key
		Assert(data.user._id === data.user.id, 'id not set to _id');	// DEPRECATE ME
		Assert(data.user.email === this.data.email, 'email doesn\'t match');
		Assert(data.user.lastLogin >= this.beforeLogin, 'lastLogin not set to most recent login time');
		if (!this.dontCheckFirstSession) {
			Assert(data.user.firstSessionStartedAt >= this.beforeLogin, 'firstSessionStartedAt not set to most recent login time');
		}
		Assert.strictEqual(data.user.lastOrigin, this.expectedOrigin, 'lastOrigin not set to plugin IDE');
		Assert(data.accessToken, 'no access token');
		Assert(this.usingSocketCluster || data.pubnubKey, 'no pubnub key');
		Assert(this.usingSocketCluster || data.pubnubToken, 'no pubnub token');
		Assert(data.broadcasterToken, 'no broadcaster token');
		const expectedCapabilities = { ...UserTestConstants.API_CAPABILITIES };
		if (this.apiConfig.email.suppressEmails) {
			delete expectedCapabilities.emailSupport;
		}
		Assert.deepStrictEqual(data.capabilities, expectedCapabilities, 'capabilities are incorrect');
		//const providerHosts = GetStandardProviderHosts(this.apiConfig);
		//Assert.deepStrictEqual(data.teams[0].providerHosts, providerHosts, 'returned provider hosts is not correct');
		Assert.deepStrictEqual(data.environmentHosts, Object.values(this.apiConfig.environmentGroup || {}));
		Assert.deepStrictEqual(data.isOnPrem, this.apiConfig.sharedGeneral.isOnPrem);
		Assert.deepStrictEqual(data.isProductionCloud, this.apiConfig.sharedGeneral.isProductionCloud);
		Assert.deepStrictEqual(data.newRelicLandingServiceUrl, this.apiConfig.sharedGeneral.newRelicLandingServiceUrl);
		this.validateSanitized(data.user, UserTestConstants.UNSANITIZED_ATTRIBUTES_FOR_ME);
	}
}

module.exports = LoginByCodeTest;
