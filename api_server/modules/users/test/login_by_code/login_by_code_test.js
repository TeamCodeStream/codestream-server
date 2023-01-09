'use strict';

const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const UserTestConstants = require('../user_test_constants');
const DetermineCapabilities = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/versioner/determine_capabilities');

class LoginByCodeTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.expectedOrigin = 'VS Code';
		this.expectedOriginDetail = 'VS Code Insiders';
		this.apiRequestOptions = {
			headers: {
				'X-CS-Plugin-IDE': 'VS Code',
				'X-CS-Plugin-IDE-Detail': 'VS Code Insiders',
			}
		};
		this.userOptions.numRegistered = 1;
		this.teamOptions.numAdditionalInvites = 0;
		delete this.teamOptions.creatorIndex;
	}

	get description () {
		return `should return valid user data when logging in by code, under one-user-per-org paradigm`;
	}

	get method () {
		return 'put';
	}

	get path () {
		return '/no-auth/login-by-code';
	}

	getExpectedFields () {
		const expectedResponse = { ...UserTestConstants.EXPECTED_LOGIN_RESPONSE };
		if (this.usingSocketCluster) {
			delete expectedResponse.pubnubKey;
			delete expectedResponse.pubnubToken;
		}
		return expectedResponse;
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.generateLoginCode,
			this.determineExpectedCapabilities
		], callback);
	}

	generateLoginCode (callback) {
		this.beforeLogin = Date.now();
		// ensure we have a login code generated to test
		const data = {
			email: this.currentUser.user.email,
			_loginCheat: this.apiConfig.sharedSecrets.confirmationCheat
		};
		if (this.useTeamId) {
			data.teamId = this.useTeamId;
		}
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
				if (this.useTeamId) {
					this.data.teamId = this.useTeamId;
				}
				callback();
			}
		);
	}

	determineExpectedCapabilities (callback) {
		(async () => {
			this.expectedCapabilities = await DetermineCapabilities({ config: this.apiConfig });
			callback();
		})();
	}

	// validate the response to the test request
	validateResponse (data) {
		// validate we get back the expected user, an access token, and a pubnub subscription key
		Assert(data.user._id === data.user.id, 'id not set to _id');	// DEPRECATE ME
		Assert(data.user.email === this.data.email, 'email doesn\'t match');
		Assert(data.user.lastLogin >= this.beforeLogin, 'lastLogin not set to most recent login time');
		if (!this.dontCheckFirstSession) {
			if (this.firstSessionShouldBeUndefined) {
				Assert.strictEqual(data.user.firstSessionStartedAt, undefined, 'firstSessionStartedAt should be undefined');
			} else {
				Assert(data.user.firstSessionStartedAt >= this.beforeLogin, 'firstSessionStartedAt not set to most recent login time');
			}
		}
		Assert.strictEqual(data.user.lastOrigin, this.expectedOrigin, 'lastOrigin not set to plugin IDE');
		Assert(data.accessToken, 'no access token');
		Assert(this.usingSocketCluster || data.pubnubKey, 'no pubnub key');
		Assert(this.usingSocketCluster || data.pubnubToken, 'no pubnub token');
		Assert(data.broadcasterToken, 'no broadcaster token');
		Assert.deepStrictEqual(data.capabilities, this.expectedCapabilities, 'capabilities are incorrect');
		Assert.deepStrictEqual(data.environmentHosts, Object.values(this.apiConfig.environmentGroup || {}));
		Assert.deepStrictEqual(data.isOnPrem, this.apiConfig.sharedGeneral.isOnPrem);
		Assert.deepStrictEqual(data.isProductionCloud, this.apiConfig.sharedGeneral.isProductionCloud || false);
		Assert.deepStrictEqual(data.newRelicLandingServiceUrl, this.apiConfig.sharedGeneral.newRelicLandingServiceUrl);
		Assert.deepStrictEqual(data.newRelicApiUrl, this.apiConfig.sharedGeneral.newRelicApiUrl, 'newRelicApiUrl not correct');
		this.validateSanitized(data.user, UserTestConstants.UNSANITIZED_ATTRIBUTES_FOR_ME);
	}
}

module.exports = LoginByCodeTest;
