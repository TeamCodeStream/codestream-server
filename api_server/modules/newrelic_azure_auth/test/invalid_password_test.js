'use strict';

const VerifyNRAzurePasswordTest = require('./verify_nr_azure_password_test');

class InvalidPasswordTest extends VerifyNRAzurePasswordTest {
	get description() {
		return 'should return an error when verifying a New Relic Azure user password and an invalid password is provided';
	}

	getExpectedError() {
		return {
			code: 'USRC-1001',
		};
	}

	// before the test runs...
	before(callback) {
		// alter the password to force a mismatch
		super.before((error) => {
			if (error) {
				return callback(error);
			}
			this.data.password += 'x';
			callback();
		});
	}
}

module.exports = InvalidPasswordTest;
