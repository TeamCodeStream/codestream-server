'use strict';

const ProviderSetTokenTest = require('./provider_set_token_test');

class UnknownProviderTest extends ProviderSetTokenTest {

	get description () {
		return 'should return an error when trying to add a provider token and the provider is not one of the known providers';
	}

	getExpectedError () {
		return {
			code: 'USRC-1013'
		};
	}
}

module.exports = UnknownProviderTest;
