'use strict';

const SetPasswordTest = require('./set_password_test');

class LoginTest extends SetPasswordTest {

	get description () {
		return 'after setting password, user should be able to login with the new password';
	}

	run (callback) {
		// run the regular test, then try to login with the new password
		super.run(error => {
			if (error) { return callback(error); }
			this.doLogin(callback);
		});
	}

	doLogin (callback) {
		// this login, using the new password, should succeed
		this.doApiRequest(
			{
				method: 'put',
				path: '/no-auth/login',
				data: {
					email: this.currentUser.user.email,
					password: this.data.password
				}
			},
			callback
		);
	}
}

module.exports = LoginTest;
