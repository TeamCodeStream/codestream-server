'use strict';

const ProviderActionTest = require('./provider_action_test');

class PayloadRequiredTest extends ProviderActionTest {

	get description () {
		return `should return error when calling the ${this.provider} action callback without a payload`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003'
		};
	}

	prepareData (callback) {
		// override final preparation of data and remove payload
		if (this.mockMode) {
			this.data = { };
		}
		else {
			this.data = '';
		}
		callback();
	}
}

module.exports = PayloadRequiredTest;
