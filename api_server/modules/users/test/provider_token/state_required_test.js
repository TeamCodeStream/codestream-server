'use strict';

const ProviderTokenTest = require('./provider_token_test');
const Assert = require('assert');

class StateRequiredTest extends ProviderTokenTest {

	constructor (options) {
		super(options);
		this.runRequestAsTest = true;
		this.apiRequestOptions = {
			noJsonInResponse: true,
			expectRedirect: true
		};
	}

	get description () {
		return 'should redirect to an error page when completing authorization flow for a third-party provider and no state parameter is sent';
	}

	getQueryParameters () {
		const parameters = super.getQueryParameters();
		delete parameters.state;
		return parameters;
	}

	validateResponse (data) {
		Assert.equal(data, `/web/error?code=RAPI-1001&provider=${this.provider}`, `redirect url not correct for ${this.provider}`);
	}
}

module.exports = StateRequiredTest;
