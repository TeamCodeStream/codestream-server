'use strict';

const SetPasswordTest = require('./set_password_test');
const Assert = require('assert');

class OldPasswordFailsTest extends SetPasswordTest {

	get description () {
		return 'should fail to login with the old password after changing password';
	}

	run (callback) {
		// run the usual test, but then try to login with the old password, which should fail
		super.run(error => {
			if (error) { return callback(error); }
			this.doLogin(callback);
		});
	}

	doLogin (callback) {
		// this login should fail, since we're using the old password
		this.doApiRequest(
			{
				method: 'put',
				path: '/no-auth/login',
				data: {
					email: this.currentUser.user.email,
					password: this.currentUser.password
				}
			},
			(error, response) => {
				Assert(error && response.code === 'USRC-1001', 'error code to login attempt is not correct');
				callback();
			}
		);
	}
}

module.exports = OldPasswordFailsTest;
