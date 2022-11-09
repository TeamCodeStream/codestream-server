// provide basic test class for login request tests

'use strict';

const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const UserTestConstants = require('../user_test_constants');
const UserAttributes = require('../../user_attributes');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const DetermineCapabilities = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/versioner/determine_capabilities');

class LoginTest extends CodeStreamAPITest {

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
		const oneUserPerOrg = this.oneUserPerOrg ? ', under one-user-per-org paradigm' : '';
		return `should return valid user when doing login${oneUserPerOrg}`;
	}

	get method () {
		return 'put';
	}

	get path () {
		return '/no-auth/login';
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
			super.before,
			this.setData,
			this.determineExpectedCapabilities
		], callback);
	}

	setData (callback) {
		this.data = {
			email: this.currentUser.user.email,
			password: this.currentUser.password
		};
		if (this.useTeamId) {
			this.data.teamId = this.useTeamId;
		}
		this.beforeLogin = Date.now();
		callback();
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
		Assert.deepStrictEqual(data.newRelicApiUrl, this.apiConfig.sharedGeneral.newRelicApiUrl, 'newRelicApiUrl not correct');
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

module.exports = LoginTest;
