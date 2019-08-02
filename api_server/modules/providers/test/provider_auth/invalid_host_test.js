'use strict';

const ProviderAuthTest = require('./provider_auth_test');
const Assert = require('assert');

class InvalidHostTest extends ProviderAuthTest {

	constructor (options) {
		super(options);
		this.apiRequestOptions = {
			noJsonInResponse: true,
			expectRedirect: true
		};
	}

	get description () {
		return `should redirect to an error page when initiating authorization flow for ${this.provider}, enterprise version, but the host is not found`;
	}

	validateResponse (data) {
		Assert.equal(data, `/web/error?code=PRVD-1003&provider=${this.provider}`, `redirect url not correct for ${this.provider}`);
	}
}

module.exports = InvalidHostTest;
