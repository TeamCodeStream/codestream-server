'use strict';

const ResendConfirmTest = require('./resend_confirm_test');

class UnknownEmailTest extends ResendConfirmTest {

	get description () {
		return 'should return empty response when calling resend confirm request with an unknown email (no email should be sent)';
	}

	// before the test runs...
	before (callback) {
		// run standard set up for the test but replace the email with an unknown email
		super.before(() => {
			this.data.email = this.userFactory.randomEmail();
			callback();
		});
	}
}

module.exports = UnknownEmailTest;
