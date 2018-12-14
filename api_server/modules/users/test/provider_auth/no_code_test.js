'use strict';

const ProviderAuthTest = require('./provider_auth_test');

class NoCodeTest extends ProviderAuthTest {

	constructor (options) {
		super(options);
		delete this.apiRequestOptions;
	}

	get description () {
		return 'should return an error when initiating authorization flow for a provider without supplying an auth code';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'code'
		};
	}

	getAuthCode (callback) {
		// intercept the call to get an auth code and just short-circuit the path without a code
		this.path = `/no-auth/provider-auth/${this.provider}`;
		callback();
	}
}

module.exports = NoCodeTest;
