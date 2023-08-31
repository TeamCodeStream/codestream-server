'use strict';

const WebProviderAuthTest = require('./web_provider_auth_test');

class NewRelicIDPAuthTest extends WebProviderAuthTest {

	constructor (options) {
		super(options);
		this.provider = 'newrelicidp';
		this.doSignupToken = true;
	}
	
	get description () {
		return `should provide the appropriate redirect, when initiating an SSO authorization flow to ${this.provider}`;
	}

	validateState (data) {
		// we get no incoming state with New Relic IDP, instead we parse the cookie that gets set
		const cookie = this.httpResponse.headers['set-cookie'].trim();
		this.realState = cookie.split('=')[1].split(':')[1].split(';')[0];
		this.validateRealState();
	}
}

module.exports = NewRelicIDPAuthTest;
