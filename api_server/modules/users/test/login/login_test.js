// provide basic test class for login request tests

'use strict';

var Assert = require('assert');
var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const UserTestConstants = require('../user_test_constants');

class LoginTest extends CodeStreamAPITest {

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
		return UserTestConstants.EXPECTED_LOGIN_RESPONSE;
	}

	dontWantToken () {
		return true;	// don't need an access token for this request
	}

	// before the test runs...
	before (callback) {
		// create a random registered user, then prepare to submit the login request
		// with the user's email and password
		const func = this.noConfirm ? 'registerUser' : 'createUser';
		this.userData = this.userFactory.getRandomUserData();
		this.userFactory[func](this.userData, (error, userData) => {
			if (error) { return callback(error); }
			this.user = userData.user;
			this.data = {
				email: this.user.email,
				password: this.userData.password
			};
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		// validate we get back the expected user, an access token, and a pubnub subscription key
		Assert(data.user.email === this.data.email, 'email doesn\'t match');
		Assert(data.accessToken, 'no access token');
		Assert(data.pubnubKey, 'no pubnub key');
		this.validateSanitized(data.user, UserTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = LoginTest;
