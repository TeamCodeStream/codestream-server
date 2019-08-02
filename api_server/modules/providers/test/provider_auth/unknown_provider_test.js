'use strict';

const ProviderAuthTest = require('./provider_auth_test');
const Assert = require('assert');

class UnknownProviderTest extends ProviderAuthTest {

	constructor (options) {
		super(options);
		this.apiRequestOptions = {
			noJsonInResponse: true,
			expectRedirect: true
		};
		this.provider = 'blahblah';
	}

	get description () {
		return 'should redirect to an error page when initiating authorization flow for an unknown provider';
	}

	validateResponse (data) {
		Assert.equal(data, `/web/error?code=PRVD-1000&provider=${this.provider}`, `redirect url not correct for ${this.provider}`);
	}
}

module.exports = UnknownProviderTest;
