'use strict';

const SetPasswordTest = require('./set_password_test');
const Assert = require('assert');

class OldTokenInvalidTest extends SetPasswordTest {

	get description () {
		return 'should return an error when using a previous access token after changing password';
	}

	before (callback) {
		// introduce a delay before running the test, since the resolution of the access token 
		// issuance time is 1 second
		super.before(error => {
			if (error) { return callback(error); }
			setTimeout(callback, 2000);
		});
	}

	run (callback) {
		// run the usual test, but then try to perform a request with the old access token, which should fail
		super.run(error => {
			if (error) { return callback(error); }
			this.fetchMe(callback);
		});
	}

	fetchMe (callback) {
		// this attempt should fail, since we're using the old access token
		this.doApiRequest(
			{
				method: 'get',
				path: '/users/me',
				token: this.token
			},
			(error, response) => {
				Assert(error && response.code === 'AUTH-1005', 'error code to login attempt is not correct');
				callback();
			}
		);
	}
}

module.exports = OldTokenInvalidTest;
