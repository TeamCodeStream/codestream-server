'use strict';

const ProviderConnectTest = require('./provider_connect_test');

class NoCodeTest extends ProviderConnectTest {

	get description () {
		return `should return error when connecting to ${this.provider} with no auth token`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'providerInfo.code'
		};
	}

	// before the test runs...
	before (callback) {
		// delete the attribute in question
		super.before(() => {
			delete this.data.providerInfo.code;
			callback();
		});
	}
}

module.exports = NoCodeTest;
