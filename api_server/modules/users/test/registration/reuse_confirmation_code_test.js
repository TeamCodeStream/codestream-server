'use strict';

const RegistrationTest = require('./registration_test');
const Assert = require('assert');

class ReuseConfirmationCodeTest extends RegistrationTest {

	get description () {
		return 'when registering a user that already exists but is unregistered, within the period of time that a confirmation code is allowed to be reused, the same confirmation code should be reused';
	}

	// run the actual test...
	run (callback) {
		// run the test twice, recording the confirmation code from the first test and checking that the code
		// returned for the second test is the same
		super.run(error => {
			if (error) { return callback(error); }
			super.run(callback);
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		// if we've already got the confirmation code from the first test, make sure the confirmation code sent back 
		// with the second registration equals the first
		if (this.firstConfirmationCode) {
			Assert.equal(this.firstConfirmationCode, data.user.confirmationCode,
				'confirmation code returned on second registration should be the same as the one returned on the first registration');
		}
		else {
			// otherwise this is the first test, just make a note of the confirmation code
			this.firstConfirmationCode = data.user.confirmationCode;
			super.validateResponse(data);
		}
	}
}

module.exports = ReuseConfirmationCodeTest;
