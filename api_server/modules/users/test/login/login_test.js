// provide basic test class for login request tests

'use strict';

const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const UserTestConstants = require('../user_test_constants');
const UserAttributes = require('../../user_attributes');
const GetStandardProviderHosts = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/providers/provider_test_constants');

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
	}

	get description () {
		return 'should return valid user when doing login';
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
		super.before(error => {
			if (error) { return callback(error); }
			this.data = {
				email: this.currentUser.user.email,
				password: this.currentUser.password
			};
			this.beforeLogin = Date.now();
			callback();
		});
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

		const { runTimeEnvironment } = this.apiConfig.sharedGeneral;
		const { environmentGroup = {} } = this.apiConfig;
		const expectedEnvironment = (
			environmentGroup &&
			environmentGroup[runTimeEnvironment] &&
			environmentGroup[runTimeEnvironment].shortName
		) || runTimeEnvironment;
		Assert.deepStrictEqual(data.capabilities, expectedCapabilities, 'capabilities are incorrect');
		const providerHosts = GetStandardProviderHosts(this.apiConfig);
		Assert.deepStrictEqual(data.teams[0].providerHosts, providerHosts, 'returned provider hosts is not correct');
		Assert.deepStrictEqual(data.runtimeEnvironment, expectedEnvironment);
		Assert.deepStrictEqual(data.environmentHosts, Object.values(environmentGroup));
		Assert.deepStrictEqual(data.isOnPrem, this.apiConfig.sharedGeneral.isOnPrem);
		Assert.deepStrictEqual(data.isProductionCloud, this.apiConfig.sharedGeneral.isProductionCloud);
		Assert.deepStrictEqual(data.newRelicLandingServiceUrl, this.apiConfig.sharedGeneral.newRelicLandingServiceUrl);
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
