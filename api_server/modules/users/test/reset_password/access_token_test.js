'use strict';

const ResetPasswordTest = require('./reset_password_test');
const UserTestConstants = require('../user_test_constants');

class AccessTokenTest extends ResetPasswordTest {

	get description () {
		return 'should return a new access token when resetting password';
	}

	get method () {
		return 'get';
	}

	get path () {
		// we'll fetch the user's me object, with the returned access token
		return '/users/me';
	}

	getExpectedFields () {
		return UserTestConstants.EXPECTED_USER_RESPONSE;
	}

	resetPassword (callback) {
		// a delay is needed, since the IAT field of the JSON web token (when the token
		// gets issued) is only accurate to within a second, and we want to ensure the
		// token will be different
		setTimeout(this.reallyResetPassword.bind(this), 2000, callback);
	}

	// do the actual rest of password
	reallyResetPassword (callback) {
		// capture the access token given in the response, we'll use this for the 
		// actual test request, which is fetch the me-object for the user with the
		// new token
		super.resetPassword((error, response) => {
			if (error) { return callback(error); }
			this.token = response.accessToken;
			delete this.data;  // not needed for the test request
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		// validate that we got back "ourselves", and that there are no attributes a client shouldn't see
		this.validateMatchingObject(this.currentUser.user._id, data.user, 'user');
		this.validateSanitized(data.user, UserTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = AccessTokenTest;
