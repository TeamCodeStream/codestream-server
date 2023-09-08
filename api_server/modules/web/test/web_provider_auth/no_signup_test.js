'use strict';

const WebProviderAuthTest = require('./web_provider_auth_test');
const Assert = require('assert');

class NoSignupTest extends WebProviderAuthTest {

	constructor (options) {
		super(options);
		this.doNoSignup = true;
	}
	
	get description () {
		return `should provide the appropriate redirect, when initiating an SSO authorization flow to ${this.provider}, and providing a flag to disallow sign-ups, which should appear in the state payload`;
	}

	validateState (data) {
		const payload = super.validateState(data);
		Assert.strictEqual(payload.nosu, '1', 'no-signup flag not correct within state payload');
	}
}

module.exports = NoSignupTest;
