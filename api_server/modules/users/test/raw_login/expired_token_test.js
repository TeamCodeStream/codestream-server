'use strict';

const LoginTest = require('./login_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const RandomString = require('randomstring');

class ExpiredTokenTest extends LoginTest {

	get description () {
		return 'raw login request should return an error if the previous access token was invalidated';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1005'
		};
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
			existingPassword: this.currentUser.password,
			newPassword: RandomString.generate(12)
		};
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
}

module.exports = ExpiredTokenTest;
