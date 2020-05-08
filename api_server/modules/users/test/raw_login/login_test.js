// provide basic test class for login request tests

'use strict';

const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const UserTestConstants = require('../user_test_constants');
const UserAttributes = require('../../user_attributes');
const STANDARD_PROVIDER_HOSTS = require(process.env.CS_API_TOP + '/modules/providers/provider_test_constants').STANDARD_PROVIDER_HOSTS;

class LoginTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.expectedOrigin = 'VS Code';
		this.expectedOriginDetail = 'VS Code Insiders';
		this.apiRequestOptions = {
			headers: {
				'X-CS-Plugin-IDE': 'VS Code',
				'X-CS-Plugin-IDE-Detail': 'VS Code Insiders'
			}
		};
		this.userOptions.numRegistered = 1;
		this.teamOptions.numAdditionalInvites = 0;
	}

	get description () {
		return 'should return valid user when doing a raw login';
	}

	get method () {
		return 'put';
	}

	get path () {
		return '/login';
	}

	getExpectedFields () {
		return UserTestConstants.EXPECTED_LOGIN_RESPONSE;
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.beforeLogin = Date.now();
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		// validate we get back the expected user, an access token, and a pubnub subscription key
		Assert(data.user._id === data.user.id, 'id not set to _id');	// DEPRECATE ME
		Assert(data.user.email === this.currentUser.user.email, 'email doesn\'t match');
		Assert(data.user.lastLogin > this.beforeLogin, 'lastLogin not set to most recent login time');
		Assert(data.user.firstSessionStartedAt > this.beforeLogin, 'firstSessionStartedAt should have been set');
		Assert.equal(data.user.lastOrigin, this.expectedOrigin, 'lastOrigin not set to plugin IDE');
		Assert(data.accessToken, 'no access token');
		Assert(this.usingSocketCluster || data.pubnubKey, 'no pubnub key');
		Assert(data.pubnubToken, 'no pubnub token');
		Assert(data.broadcasterToken, 'no broadcaster token');
		Assert.deepEqual(data.capabilities, UserTestConstants.API_CAPABILITIES, 'capabilities are incorrect');
		Assert.deepEqual(data.teams[0].providerHosts, STANDARD_PROVIDER_HOSTS, 'returned provider hosts is not correct');
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
