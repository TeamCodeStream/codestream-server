'use strict';

const ConfirmUserTest = require('./confirm_user_test');
const Assert = require('assert');
const RandomString = require('randomstring');

class PasswordTest extends ConfirmUserTest {

	get description () {
		return 'should be able to set a password when submitting a request to confirm a user, checked by using the password to login';
	}

	// before the test runs...
	before (callback) {
		// set a new password in the request body
		super.before(error => {
			if (error) { return callback(error); }
			this.data.password = RandomString.generate(12);
			callback();
		});
	}

	run (callback) {
		super.run(error => {
			if (error) { return callback(error); }
			this.doApiRequest(
				{
					method: 'put',
					path: '/no-auth/login',
					data: {
						email: this.data.email,
						password: this.data.password
					}
				},
				loginError => {
					if (loginError) {
						Assert.fail('error returned by login with generated password');
					}
					callback();
				}
			);
		});
	}
}

module.exports = PasswordTest;
