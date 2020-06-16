'use strict';

var ResendConfirmTest = require('./resend_confirm_test');

class RequiredParameterTest extends ResendConfirmTest {

	get description () {
		return `should return an error when calling to resend a confirmation email with no ${this.parameter} provided`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: this.parameter
		};
	}

	// before the test runs...
	before (callback) {
		// run standard set up for the test but delete the parameter indicated
		super.before(() => {
			delete this.data[this.parameter];
			callback();
		});
	}
}

module.exports = RequiredParameterTest;
