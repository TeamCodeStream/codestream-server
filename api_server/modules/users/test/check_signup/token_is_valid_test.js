'use strict';

const CheckSignupTest = require('./check_signup_test');
const Assert = require('assert');

class TokenIsValidTest extends CheckSignupTest {

	get description () {
		return 'access token returned with check-signup response should be valid for use';
	}

	// run the actual test...
	run (callback) {
		// run the main test, but then confirm we can use the access token
		super.run(error => {
			if (error) { return callback(error); }
			this.doApiRequest(
				{
					method: 'get',
					path: '/users/me',
					token: this.response.accessToken
				},
				(getMeError, response) => {
					if (getMeError) { return callback(getMeError); }
					Assert(response.user.id === this.response.user.id, '/me did not return same user');
					callback();
				}
			);
		});
	}
}

module.exports = TokenIsValidTest;
