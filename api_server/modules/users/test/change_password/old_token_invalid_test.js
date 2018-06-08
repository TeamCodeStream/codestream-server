'use strict';

const ChangePasswordTest = require('./change_password_test');

class OldTokenInvalidTest extends ChangePasswordTest {

	get description () {
		return 'should return an error when using a previous access token after changing password';
	}

	get method () {
		return 'get';
	}

	get path () {
		// we'll fetch the user's me object, with the original access token, this should fail
		return '/users/me';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1005'
		};
	}

	// before the test runs...
	before (callback) {
		// a delay is needed, since the IAT field of the JSON web token (when the token
		// gets issued) is only accurate to within a second, and we want to ensure the
		// token will be different
		setTimeout(() => {
			super.before(callback);
		}, 2000);
	}

	// do the actual change of password
	changePassword (callback) {
		// do the change of password, but we're ignoring the returned access token
		// and will attempt to fetch the user's me-object with the old token,
		// this should fail
		super.changePassword(error => {
			if (error) { return callback(error); }
			delete this.data;  // not needed for the test request
			callback();
		});
	}
}

module.exports = OldTokenInvalidTest;
