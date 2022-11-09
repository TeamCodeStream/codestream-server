'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const UserTestConstants = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/test/user_test_constants');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');
const Assert = require('assert');

class EnsureUserTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 1;
		delete this.teamOptions.creatorIndex;
		this.teamOptions.numAdditionalInvites = 0;
	}

	get description () {
		return 'should create a new registered user when ensuring a user across environments and the user does not exist';
	}

	get method () {
		return 'post';
	}

	get path () {
		return '/xenv/ensure-user';
	}

	getExpectedFields () {
		const expectedResponse = DeepClone(UserTestConstants.EXPECTED_USER_RESPONSE);
		const index = expectedResponse.user.indexOf('_pubnubUuid');
		expectedResponse.user.splice(index, 1);
		return expectedResponse;
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			// in order to simulate user data coming from another server, we'll use the existing
			// "current" user, but change email to a random email, this should create a user with
			// the same user data, but with the randomly created email
			this.data = { user: this.userFactory.getRandomUserData() };
			this.data.user.searchableEmail = this.data.user.email.toLowerCase();
			this.apiRequestOptions = {
				headers: {
					'X-CS-Auth-Secret': this.apiConfig.environmentGroupSecrets.requestAuth
				}
			};
			callback();
		});
	}

	validateResponse (data) {
		if (this.shouldBeCurrentUser) {
			Assert.strictEqual(data.user.id, this.currentUser.user.id, 'current user was not returned');
		} else {
			Assert.notStrictEqual(data.user.id, this.currentUser.user.id, 'current user was returned');
		}
		Assert.strictEqual(data.user.email, this.data.user.email, 'user created does not have the correct email');
		Assert(data.accessToken, 'no access token returned');
	}
}

module.exports = EnsureUserTest;
