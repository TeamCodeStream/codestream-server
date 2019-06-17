'use strict';

const ProviderConnectTest = require('./provider_connect_test');

class InvalidCodeTest extends ProviderConnectTest {

	get description () {
		return `should return error when connecting to ${this.provider} with an invalid auth code`;
	}

	getExpectedError () {
		return {
			code: 'USRC-1014'
		};
	}

	// before the test runs...
	before (callback) {
		// substitute a totally bogus auth token
		super.before(() => {
			this.data.providerInfo.code = 'invalid-code';
			callback();
		});
	}
}

module.exports = InvalidCodeTest;
