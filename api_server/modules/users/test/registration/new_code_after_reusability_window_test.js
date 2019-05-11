'use strict';

const RegistrationTest = require('./registration_test');
const Assert = require('assert');

class NewCodeAfterReusabilityWindowTest extends RegistrationTest {

	get description () {
		return 'when registering a user that already exists but is unregistered, outside of the period of time that a confirmation code is allowed to be reused, a different confirmation code should be used';
	}

	// before the test runs...
	before (callback) {
		// add a reusability timeout to make the code live less time than the normal hour
		super.before(error => {
			if (error) { return callback(error); }
			this.data.reuseTimeout = 1000;
			callback();
		});
	}

	// run the actual test...
	run (callback) {
		// run the test twice, then wait for longer than the reusability window, recording the confirmation code
		// from the first test and checking that the code returned for the second test is NOT the same
		super.run(error => {
			if (error) { return callback(error); }
			setTimeout(() => {
				super.run(callback);
			}, 2000);
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		// if we've already got the confirmation code from the first test, make sure the confirmation code sent back 
		// with the second registration equals the first
		if (this.firstConfirmationCode) {
			Assert.notEqual(this.firstConfirmationCode, data.user.confirmationCode,
				'confirmation code returned on second registration should NOT be the same as the one returned on the first registration');
		}
		else {
			// otherwise this is the first test, just make a note of the confirmation code
			this.firstConfirmationCode = data.user.confirmationCode;
			super.validateResponse(data);
		}
	}
}

module.exports = NewCodeAfterReusabilityWindowTest;
