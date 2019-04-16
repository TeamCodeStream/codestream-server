'use strict';

const ProviderTokenTest = require('./provider_token_test');
const Assert = require('assert');

class UnknownProviderTest extends ProviderTokenTest {

	constructor (options) {
		super(options);
		this.runRequestAsTest = true;
		this.provider = 'blahblah';
		this.apiRequestOptions = {
			noJsonInResponse: true,
			expectRedirect: true
		};
	}

	get description () {
		return 'should redirect to an error page when completing authorization flow for an unknown provider';
	}

	validateResponse (data) {
		Assert.equal(data, '/web/error?code=USRC-1013', `redirect url not correct for ${this.provider}`);
	}
}

module.exports = UnknownProviderTest;
