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
		const cookie = this.extractCookie();
		this.realState = decodeURIComponent(cookie.split('=')[1]).split(':')[1].split(';')[0];
		const parts = this.realState.split('.');
		this.realState = parts.slice(0, parts.length-1).join('.');
		this.validateRealState();
	}
}

module.exports = NewRelicIDPAuthTest;
