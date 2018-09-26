'use strict';

const ChangePasswordTest = require('./change_password_test');

class OldPasswordFailsTest extends ChangePasswordTest {

	get description () {
		return 'should fail to login with the old password after changing password';
	}

	getExpectedError () {
		return {
			code: 'USRC-1001'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.password = this.users[0].password;  // replace new password with old
			callback();
		});
	}
}

module.exports = OldPasswordFailsTest;
