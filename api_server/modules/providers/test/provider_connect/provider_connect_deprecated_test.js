'use strict';

const ProviderConnectTest = require('./provider_connect_test');

class ProviderConnectDeprecatedTest extends ProviderConnectTest {

	get description () {
		return `should return error when attempting to perform a provider-connect request, support is deprecated`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1016'
		};
	}
}

module.exports = ProviderConnectDeprecatedTest;
