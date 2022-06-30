'use strict';

const VerifyNRAzurePasswordTest = require('./verify_nr_azure_password_test');

class InvalidEmailTest extends VerifyNRAzurePasswordTest {
	get description() {
		return 'should return an error when verifying a New Relic Azure user password and an invalid email is provided';
	}

	getExpectedError() {
		return {
			code: 'USRC-1001',
		};
	}

	// before the test runs...
	before(callback) {
		// replace the test email with something random...
		super.before((error) => {
			if (error) {
				return callback(error);
			}
			this.data.email = this.userFactory.randomEmail();
			callback();
		});
	}
}

module.exports = InvalidEmailTest;
