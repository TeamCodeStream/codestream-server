'use strict';

const WebProviderAuthTest = require('./web_provider_auth_test');
const UUID = require('uuid').v4;

class NRUserIdTest extends WebProviderAuthTest {

	constructor (options) {
		super(options);
		this.provider = 'newrelicidp';
		this.doSignupToken = true;
		this.nrUserId = 1000000000 + Math.floor(Math.random() * 999999999);
		this.email = this.userFactory.randomEmail();
		this.authDomainId = UUID();
	}
	
	get description () {
		return `should provide the appropriate redirect, when initiating an SSO authorization flow to New Relic, and providing an NR User ID, which should appear in the redirect parameters`;
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

module.exports = NRUserIdTest;
