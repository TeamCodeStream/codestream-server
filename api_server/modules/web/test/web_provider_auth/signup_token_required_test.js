'use strict';

const NewRelicIDPAuthTest = require('./newrelic_idp_auth_test');
const Assert = require('assert');

class SignupTokenRequiredTest extends NewRelicIDPAuthTest {

	constructor (options) {
		super(options);
		delete this.doSignupToken;
	}
	
	get description () {
		return 'should redirect to an error page when initiating New Relic IDP authorization flow, and no signup token is sent';
	}

	validateResponse (data) {
		Assert.strictEqual(data, `/web/error?code=RAPI-1001&provider=${this.provider}`, `redirect url not correct for ${this.provider}`);
	}
}

module.exports = SignupTokenRequiredTest;
