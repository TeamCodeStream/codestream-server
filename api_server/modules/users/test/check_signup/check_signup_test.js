'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const Assert = require('assert');
const UserTestConstants = require('../user_test_constants');
const CommonInit = require('./common_init');
const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const GetStandardProviderHosts = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/providers/provider_test_constants');

class CheckSignupTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 0;
		delete this.teamOptions.creatorIndex;
		this.expectedOrigin = 'VS Code';
		this.apiRequestOptions = {
			headers: {
				'X-CS-Plugin-IDE': this.expectedOrigin
			}
		};
	}

	get description () {
		return 'should return login data and an access token when a user has been issued a signup token and signed up with it';
	}

	get method () {
		return 'put';
	}

	get path () {
		return '/no-auth/check-signup';
	}

	getExpectedFields () {
		const expectedResponse = { ...UserTestConstants.EXPECTED_LOGIN_RESPONSE };
		if (this.usingSocketCluster) {
			delete expectedResponse.pubnubKey;
			delete expectedResponse.pubnubToken;
		}
		return expectedResponse;
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
		// validate we get back the expected user, an access token, and a pubnub subscription key
		Assert(data.user.email === this.currentUser.user.email, 'email doesn\'t match');
		Assert(data.user.lastLogin >= this.beforeLogin, 'lastLogin not set to most recent login time');
		Assert(data.user.firstSessionStartedAt >= this.beforeLogin, 'firstSessionStartedAt not set to most recent login time');		
		Assert.equal(data.user.lastOrigin, this.expectedOrigin, 'lastOrigin not set to plugin IDE');
		Assert(data.accessToken, 'no access token');
		Assert(this.usingSocketCluster || data.pubnubKey, 'no pubnub key');
		Assert(this.usingSocketCluster || data.pubnubToken, 'no pubnub token');
		Assert(data.broadcasterToken, 'no broadcaster token');
		const expectedCapabilities = { ...UserTestConstants.API_CAPABILITIES };
		if (this.apiConfig.email.suppressEmails) {
			delete expectedCapabilities.emailSupport;
		}
		Assert.deepStrictEqual(data.capabilities, expectedCapabilities, 'capabilities are incorrect');
		if (!this.dontCreateTeam) {
			Assert(data.teams.length === 1, 'no team in response');
			const providerHosts = GetStandardProviderHosts(this.apiConfig);
			Assert.deepStrictEqual(data.teams[0].providerHosts, providerHosts, 'returned provider hosts is not correct');
			this.validateMatchingObject(this.team.id, data.teams[0], 'team');
		}
		else {
			Assert(data.teams.length === 0, 'team in response');
		}
		Assert.strictEqual(!!data.isWebmail, !!this.wantWebmail, 'isWebmail flag is incorrect');
		this.validateSanitized(data.user, UserTestConstants.UNSANITIZED_ATTRIBUTES_FOR_ME);
	}
}

module.exports = CheckSignupTest;
