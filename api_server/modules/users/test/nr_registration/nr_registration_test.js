'use strict';

const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const UserTestConstants = require('../user_test_constants');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');
const DetermineCapabilities = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/versioner/determine_capabilities');

class NRRegistrationTest extends CodeStreamAPITest {

	get description () {
		return `should return valid user data when registering, under one-user-per-org`;
	}

	get method () {
		return 'post';
	}

	get path () {
		return '/no-auth/nr-register';
	}

	getExpectedFields () {
		const expectedResponse = DeepClone(UserTestConstants.EXPECTED_LOGIN_RESPONSE);
		if (this.usingSocketCluster) {
			delete expectedResponse.pubnubKey;
			delete expectedResponse.pubnubToken;
		}
		const index = expectedResponse.user.indexOf('timeZone');
		if (index !== -1) {
			expectedResponse.user.splice(index, 1);
		}
		return expectedResponse;
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.expectedUserData = this.userFactory.randomNamedUser();
			this.expectedUserData._pubnubUuid = this.userFactory.getNextPubnubUuid();			
			const userId = Math.floor(Math.random() * 1000000000);
			this.expectedUserData.providerInfo = {
				newrelic: {
					accessToken: 'dummy',
					data: {
						userId: userId
					},
					isApiToken: true
				}
			};
			this.data = {
				apiKey: 'dummy',
				_pubnubUuid: this.expectedUserData._pubnubUuid
			};
			this.apiRequestOptions = {
				headers: {
					// TODO: use more appropriate secret
					'X-CS-NewRelic-Secret': this.apiConfig.sharedSecrets.commentEngine,
					'X-CS-Mock-Email': this.expectedUserData.email,
					'X-CS-Mock-Id': userId,
					'X-CS-Mock-Name': this.expectedUserData.fullName
				}
			};
			this.ignoreTokenOnRequest = true;
			this.expectedVersion = 1;
			this.beforeLogin = Date.now();
			this.determineExpectedCapabilities(callback);
		});
	}

	determineExpectedCapabilities (callback) {
		(async () => {
			this.expectedCapabilities = await DetermineCapabilities({ config: this.apiConfig });
			callback();
		})();
	}

	/* eslint complexity: 0 */
	validateResponse (data) {
		let user = data.user;
		let errors = [];
		const email = this.expectedUserData.email.trim();
		const username = email.split('@')[0].replace(/\+/g, '');
		const userId = this.expectedUserData.providerInfo.newrelic.data.userId;
		let result = (
			((user.id === user._id) || errors.push('id not set to _id')) && 	// DEPRECATE ME
			((user.email === email) || errors.push('incorrect email')) &&
			((user.username === username) || errors.push('incorrect username')) &&
			((user.fullName === this.expectedUserData.fullName) || errors.push('incorrect full name')) &&
			((user.deactivated === false) || errors.push('deactivated not false')) &&
			((typeof user.createdAt === 'number') || errors.push('createdAt not number')) &&
			((user.modifiedAt >= user.createdAt) || errors.push('modifiedAt not greater than or equal to createdAt')) &&
			((user.creatorId === (this.expectedCreatorId || user.id).toString()) || errors.push('creatorId not equal to id')) &&
			((user.phoneNumber === '') || errors.push('phoneNumber not set to default of empty string')) &&
			((user.iWorkOn === '') || errors.push('iWorkOn not set to default value of empty string')) &&
			((user.version === this.expectedVersion) || errors.push('version is not correct')) &&
			((user.nrUserId === userId) || errors.push('nrUserId not correct'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		Assert(data.user.lastLogin >= this.beforeLogin, 'lastLogin not set to most recent login time');
		Assert.deepEqual(user.providerInfo, this.expectedUserData.providerInfo, 'providerInfo is not correct');
		Assert.deepEqual(user.providerIdentities, [], 'providerIdentities is not an empty array');
		// verify we got no attributes that clients shouldn't see
		this.validateSanitized(user, UserTestConstants.UNSANITIZED_ATTRIBUTES_FOR_ME);
	
		// validate we get back the expected user, an access token, and a pubnub subscription key
		Assert(data.user.firstSessionStartedAt >= this.beforeLogin, 'firstSessionStartedAt not set to most recent login time');
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
	}
}

module.exports = NRRegistrationTest;
