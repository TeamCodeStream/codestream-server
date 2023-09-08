'use strict';

const WebProviderAuthTest = require('./web_provider_auth_test');
const Assert = require('assert');

class SignupTokenTest extends WebProviderAuthTest {

	constructor (options) {
		super(options);
		this.doSignupToken = true;
	}
	
	get description () {
		return `should provide the appropriate redirect, when initiating an SSO authorization flow to ${this.provider}, and providing a signup token, which should appear in the state payload`;
	}

	validateState (data) {
		const payload = super.validateState(data);
		Assert.strictEqual(payload.st, this.signupToken, 'signupToken not correct within state payload');
	}
}

module.exports = SignupTokenTest;
