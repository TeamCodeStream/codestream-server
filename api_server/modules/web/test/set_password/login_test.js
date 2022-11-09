'use strict';

const SetPasswordTest = require('./set_password_test');
const Assert = require('assert');

class LoginTest extends SetPasswordTest {

	get description () {
		return 'once a user has reset their password using a forgot-password link, they should be able to login with the new password';
	}

	run (callback) {
		super.run(error => {
			if (error) { return callback(error); }
			this.doApiRequest(
				{
					method: 'put',
					path: '/no-auth/login',
					data: {
						email: this.currentUser.user.email,
						password: this.newPassword
					}
				},
				error => {
					Assert(!error, 'error during login');
					callback();
				}
			);
		});
	}
}

module.exports = LoginTest;
