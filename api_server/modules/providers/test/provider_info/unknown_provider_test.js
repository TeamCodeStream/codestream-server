'use strict';

const ProviderInfoTest = require('./provider_info_test');

class UnknownProviderTest extends ProviderInfoTest {

	get description () {
		return 'should return an error when trying to set provider info and the provider is not one of the known providers';
	}

	getExpectedError () {
		return {
			code: 'PRVD-1000'
		};
	}
}

module.exports = UnknownProviderTest;
