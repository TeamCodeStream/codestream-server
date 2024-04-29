'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const Assert = require('assert');
const UserTestConstants = require('../user_test_constants');
const CommonInit = require('./common_init');
const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const GetStandardProviderHosts = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/providers/provider_test_constants');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');
const UserAttributes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/user_attributes');

class CheckSignupTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	constructor (options) {
		super(options);
		this.expectedOrigin = 'VS Code';
		this.apiRequestOptions = {
			headers: {
				'X-CS-Plugin-IDE': this.expectedOrigin
			}
		};
	}

	get description () {
		return 'should return login data and an access token when a user has been issued a signup token and signed up with it through a third-party provider';
	}

	get method () {
		return 'put';
	}

	get path () {
		return '/no-auth/check-signup';
	}

	getExpectedFields () {
		const expectedResponse = DeepClone(UserTestConstants.EXPECTED_LOGIN_RESPONSE);
		if (this.usingSocketCluster) {
			delete expectedResponse.pubnubKey;
			delete expectedResponse.pubnubToken;
		}
		delete expectedResponse.user._pubnubUuid;
		['timeZone', '_pubnubUuid'].forEach(attr => {
			const index = expectedResponse.user.indexOf(attr);
			if (index > -1) {
				expectedResponse.user.splice(index, 1);
			}
		});
		return expectedResponse;
	}

	// before the test runs...
	before (callback) {
		this.beforeLogin = Date.now();
		this.init(callback);
	}

	// validate the response to the test request
	validateResponse (data) {
		// validate we get back the expected user, an access token, and a pubnub subscription key
		Assert(data.user._id === data.user.id, 'id not set to _id');	// DEPRECATE ME
		//Assert(data.user.email === this.data.email, 'email doesn\'t match');
		Assert(data.user.lastLogin >= this.beforeLogin, 'lastLogin not set to most recent login time');
		Assert.strictEqual(data.user.lastOrigin, this.expectedOrigin, 'lastOrigin not set to plugin IDE');
		Assert(data.accessToken, 'no access token');
		Assert(this.usingSocketCluster || data.pubnubKey, 'no pubnub key');
		Assert(this.usingSocketCluster || data.pubnubToken, 'no pubnub token');
		Assert(data.broadcasterToken, 'no broadcaster token');

		const { runTimeEnvironment } = this.apiConfig.sharedGeneral;
		const environmentGroup = this.apiConfig.environmentGroup || {};
		const expectedEnvironment = (
			environmentGroup &&
			environmentGroup[runTimeEnvironment] &&
			environmentGroup[runTimeEnvironment].shortName
		) || runTimeEnvironment;
		Assert.deepStrictEqual(data.capabilities, this.expectedCapabilities, 'capabilities are incorrect');
		Assert.deepStrictEqual(data.runtimeEnvironment, expectedEnvironment, 'runtimeEnvironment not correct');
		Assert.deepStrictEqual(data.environmentHosts, Object.values(environmentGroup), 'environmentHosts not correct');
		Assert.deepStrictEqual(data.isOnPrem, this.apiConfig.sharedGeneral.isOnPrem, 'isOnPrem not correct');
		Assert.deepStrictEqual(data.isProductionCloud, this.apiConfig.sharedGeneral.isProductionCloud || false, 'isProductionCloud not correct');
		Assert.deepStrictEqual(data.newRelicLandingServiceUrl, this.apiConfig.sharedGeneral.newRelicLandingServiceUrl, 'newRelicLandingServiceUrl not correct');
		Assert.deepStrictEqual(data.o11yServerUrl, this.apiConfig.sharedGeneral.o11yServerUrl, 'o11yServerUrl not correct');
		Assert.deepStrictEqual(data.newRelicApiUrl, this.apiConfig.sharedGeneral.newRelicApiUrl, 'newRelicApiUrl not correct');
		Assert(
			data.user.providerInfo &&
			data.user.providerInfo[this.provider] &&
			data.user.providerInfo[this.provider].accessToken,
			'no provider access token in response'
		);
		this.validateSanitized(data.user, UserTestConstants.UNSANITIZED_ATTRIBUTES_FOR_ME);
	}

	// validate that the received user data does not have any attributes a client shouldn't see
	validateSanitized (user, fields) {
		// because me-attributes are usually sanitized out (for other users), but not for the fetching user,
		// we'll need to filter these out before calling the "base" validateSanitized, which would otherwise
		// fail when it sees these attributes
		let meAttributes = Object.keys(UserAttributes).filter(attribute => UserAttributes[attribute].forMe);
		meAttributes.forEach(attribute => {
			let index = fields.indexOf(attribute);
			if (index !== -1) {
				fields.splice(index, 1);
			}
		});
		super.validateSanitized(user, fields);
	}
}

module.exports = CheckSignupTest;
