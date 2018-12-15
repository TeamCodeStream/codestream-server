'use strict';

const ProviderAuthTest = require('./provider_auth_test');

class UnknownProviderTest extends ProviderAuthTest {

	constructor (options) {
		super(options);
		delete this.apiRequestOptions;
		this.provider = 'blahblah';
	}

	get description () {
		return 'should return an error when initiating authorization flow for an unknown provider';
	}

	getExpectedError () {
		return {
			code: 'USRC-1013'
		};
	}
}

module.exports = UnknownProviderTest;
