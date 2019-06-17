'use strict';

const LoginTest = require('./login_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const RandomString = require('randomstring');

class NewTokenTest extends LoginTest {

	get description () {
		return 'login request should return a new access token if the previous access token was invalidated';
	}

	// before the test runs...
	before (callback) {
		// set up the test, but before we do the actual login, change the user's password,
		// we'll then verify that we get a different access token than the one we had before
		BoundAsync.series(this, [
			super.before,
			this.wait,
			this.changeUserPassword
		], callback);
	}

	// wait a bit... need to do this because the issuance field in the token is only accurate
	// to within a second, and we need to ensure a new token is generated
	wait (callback) {
		setTimeout(callback, 2000);
	}

	// change the user's password, which should force a new access token when we do the login
	changeUserPassword (callback) {
		const passwordData = {
			existingPassword: this.data.password,
			newPassword: RandomString.generate(12)
		};
		this.data.password = passwordData.newPassword;  // use this for the login request
		this.doApiRequest(
			{
				method: 'put',
				path: '/password',
				data: passwordData,
				token: this.token
			},
			callback
		);
	}
	
	// validate the response to the test request
	validateResponse (data) {
		// verify the returned access token is difference
		Assert.notEqual(data.accessToken, this.accessToken, 'access token received is the same as the original access token');
		super.validateResponse(data);
	}
}

module.exports = NewTokenTest;
