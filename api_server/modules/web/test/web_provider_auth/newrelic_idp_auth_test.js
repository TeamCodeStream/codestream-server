'use strict';

const WebProviderAuthTest = require('./web_provider_auth_test');

class NewRelicIDPAuthTest extends WebProviderAuthTest {

	constructor (options) {
		super(options);
		this.provider = 'newrelicidp';
		this.doSignupToken = true;
	}
	
	get description () {
		let desc = `should provide the appropriate redirect, when initiating an SSO authorization flow to ${this.provider}`;
		if (this.idpDomain) {
			desc += ', with IDP domain ' + this.idpDomain;
		}
		return desc;
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
