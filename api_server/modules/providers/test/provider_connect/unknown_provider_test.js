'use strict';

const ProviderConnectTest = require('./provider_connect_test');

class UnknownProviderTest extends ProviderConnectTest {

	get description () {
		return 'should return error when calling provider-connect with an unknown provider';
	}

	getExpectedError () {
		return {
			code: 'PRVD-1000',
			info: this.provider
		};
	}
}

module.exports = UnknownProviderTest;
