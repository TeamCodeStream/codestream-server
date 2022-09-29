'use strict';

const EnsureExistingUserTest = require('./ensure_existing_user_test');
const Assert = require('assert');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');
const UserTestConstants = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/test/user_test_constants');

class OneUserPerOrgExistingUserTest extends EnsureExistingUserTest {

	constructor (options) {
		super(options);
		this.oneUserPerOrg = true;
	}

	get description () {
		return 'should create a new user record under one-user-per-org, when ensuring a user across environments and the user already exists';
	}

	getExpectedFields () {
		const expectedResponse = DeepClone(UserTestConstants.EXPECTED_USER_RESPONSE);
		const index = expectedResponse.user.indexOf('_pubnubUuid');
		expectedResponse.user.splice(index, 1);
		return expectedResponse;
	}

	// validate the response to the test request
	validateResponse (data) {
		// validate that we got back the correct user, and access token
		Assert.notStrictEqual(data.user.id, this.currentUser.user.id, 'new user should have been created, but existing user was returned');
		Assert(data.accessToken, 'no access token returned');
	}
}

module.exports = OneUserPerOrgExistingUserTest;
