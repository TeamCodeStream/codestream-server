'use strict';

const ProviderAuthTest = require('./provider_auth_test');
const Assert = require('assert');

class NoCodeTest extends ProviderAuthTest {

	constructor (options) {
		super(options);
		this.apiRequestOptions = {
			noJsonInResponse: true,
			expectRedirect: true
		};
	}

	get description () {
		return 'should redirect to an error page when initiating authorization flow for a provider without supplying an auth code';
	}

	getAuthCode (callback) {
		// intercept the call to get an auth code and just short-circuit the path without a code
		this.path = `/no-auth/provider-auth/${this.provider}`;
		callback();
	}

	validateResponse (data) {
		Assert.equal(data, `/web/error?code=RAPI-1001&provider=${this.provider}`, `redirect url not correct for ${this.provider}`);
	}
}

module.exports = NoCodeTest;
