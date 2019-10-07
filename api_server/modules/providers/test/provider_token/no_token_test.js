'use strict';

const ProviderTokenTest = require('./provider_token_test');
const Assert = require('assert');

class NoTokenTest extends ProviderTokenTest {

	constructor (options) {
		super(options);
		this.runRequestAsTest = true;
		this.apiRequestOptions = {
			noJsonInResponse: true,
			expectRedirect: true
		};
	}

	get description () {
		return 'should redirect to an error page when completing a third-party provider authorization flow and no access token was returned by the provider';
	}

	getQueryParameters () {
		const parameters = super.getQueryParameters();
		parameters._mockToken = 'noToken';
		return parameters;
	}

	validateResponse (data) {
		Assert.equal(data, `/web/error?code=RAPI-1010&provider=${this.provider}`, `redirect url not correct for ${this.provider}`);
	}
}

module.exports = NoTokenTest;
