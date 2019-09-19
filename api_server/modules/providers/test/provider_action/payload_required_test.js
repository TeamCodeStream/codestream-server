'use strict';

const ProviderActionTest = require('./provider_action_test');

class PayloadRequiredTest extends ProviderActionTest {

	get description () {
		return `should return error when calling the ${this.provider} action callback without a payload`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'payload'
		};
	}

	// before the test runs...
	before (callback) {
		// delete the payload from the request
		super.before(() => {
			delete this.data.payload;
			callback();
		});
	}
}

module.exports = PayloadRequiredTest;
