'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const UserTestConstants = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/test/user_test_constants');
const Assert = require('assert');

class EnsureExistingUserTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		delete this.teamOptions.creatorIndex;
		this.userOptions.numRegistered = 1;
	}

	get description () {
		return 'should fetch the existing user, matched by email, when ensuring a user across environments';
	}

	get method () {
		return 'post';
	}

	get path () {
		return '/xenv/ensure-user';
	}

	getExpectedFields () {
		return UserTestConstants.EXPECTED_USER_RESPONSE;
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			// "ensure" the current user
			this.data = { user: this.currentUser.user };
			this.apiRequestOptions = {
				headers: {
					'X-CS-Auth-Secret': this.apiConfig.sharedSecrets.auth
				}
			};
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		// validate that we got back the correct user, and access token
		this.validateMatchingObject(this.currentUser.user.id, data.user, 'user');
		Assert(data.accessToken, 'no access token returned');
	}
}

module.exports = EnsureExistingUserTest;
