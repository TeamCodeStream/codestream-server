'use strict';

const ProviderConnectTest = require('./provider_connect_test');

class UnknownProviderTest extends ProviderConnectTest {

	get description () {
		return 'should return error when calling provider-connect with an unknown provider';
	}

	getExpectedError () {
		return {
			code: 'USRC-1013',
			info: this.provider
		};
	}
}

module.exports = UnknownProviderTest;
