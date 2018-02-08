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
		return true;
	}

	before (callback) {
		this.userData = this.userFactory.getRandomUserData();
		this.userFactory.createUser(this.userData, (error, userData) => {
			if (error) { return callback(error); }
			this.user = userData.user;
			this.data = {
				email: this.user.email,
				password: this.userData.password
			};
			callback();
		});
	}

	validateResponse (data) {
		Assert(data.user.email === this.data.email, 'email doesn\'t match');
		Assert(data.accessToken, 'no access token');
		Assert(data.pubnubKey, 'no pubnub key');
		this.validateSanitized(data.user, UserTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = LoginTest;
