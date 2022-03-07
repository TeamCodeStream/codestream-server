'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const UserTestConstants = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/test/user_test_constants');
const Assert = require('assert');

class FetchUserTest extends CodeStreamAPITest {

	get description () {
		return 'should fetch a user across environments when requested';
	}

	getExpectedFields () {
		return UserTestConstants.EXPECTED_USER_RESPONSE;
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			// we'll fetch "ourselves", either by literal ID, or by "me" in the path
			this.path = '/xenv/fetch-user?email=' + encodeURIComponent(this.currentUser.user.email);
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
		// validate that we got back the correct user, and that there are no attributes a client shouldn't see
		this.validateMatchingObject(this.currentUser.user.id, data.user, 'user');
	}
}

module.exports = FetchUserTest;
