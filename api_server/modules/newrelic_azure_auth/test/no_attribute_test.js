'use strict';

const VerifyNRAzurePasswordTest = require('./verify_nr_azure_password_test');

class NoAttributeTest extends VerifyNRAzurePasswordTest {
	get description() {
		return `should return an error when verifying a New Relic Azure user password and no ${this.attribute} is provided`;
	}

	getExpectedError() {
		return {
			code: 'RAPI-1001',
			info: this.attribute,
		};
	}

	// before the test runs...
	before(callback) {
		// remove the given attribute
		super.before(() => {
			delete this.data[this.attribute];
			callback();
		});
	}
}

module.exports = NoAttributeTest;
