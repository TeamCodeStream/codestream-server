// provide basic test class for login request tests

'use strict';

var Assert = require('assert');
var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const UserTestConstants = require('../user_test_constants');

class LoginTest extends CodeStreamAPITest {

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

	// validate the response to the test request
	validateResponse (data) {
		// validate we get back the expected user, an access token, and a pubnub subscription key
		Assert(data.user.email === this.currentUser.email, 'email doesn\'t match');
		Assert(data.accessToken, 'no access token');
		Assert(data.pubnubKey, 'no pubnub key');
		this.validateSanitized(data.user, UserTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = LoginTest;
