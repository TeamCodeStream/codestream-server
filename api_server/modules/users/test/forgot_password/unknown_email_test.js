'use strict';

const ForgotPasswordTest = require('./forgot_password_test');

class UnknownEmailTest extends ForgotPasswordTest {

	get description () {
		return 'should succeed silently when a password reset request is received with an unknown email provided';
	}

	// before the test runs...
	before (callback) {
		// substitute a random email
		super.before(error => {
			if (error) { return callback(error); }
			this.data.email = this.userFactory.randomEmail();
			callback();
		});
	}
}

module.exports = UnknownEmailTest;
