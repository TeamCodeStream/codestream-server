'use strict';

const ProviderTokenTest = require('./provider_token_test');
const Assert = require('assert');

class InvalidTokenTest extends ProviderTokenTest {

	constructor (options) {
		super(options);
		this.runRequestAsTest = true;
		this.apiRequestOptions = {
			noJsonInResponse: true,
			expectRedirect: true
		};
	}

	get description () {
		return 'should redirect to an error page when completing a third-party provider authorization flow and the state token is not valid';
	}

	getQueryParameters () {
		const parameters = super.getQueryParameters();
		parameters.state = 'xyz';
		return parameters;
	}

	validateResponse (data) {
		Assert.equal(data, `/web/error?code=AUTH-1002&provider=${this.provider}`, `redirect url not correct for ${this.provider}`);
	}
}

module.exports = InvalidTokenTest;
