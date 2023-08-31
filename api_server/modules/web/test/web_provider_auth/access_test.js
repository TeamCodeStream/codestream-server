'use strict';

const WebProviderAuthTest = require('./web_provider_auth_test');
const Assert = require('assert');

class AccessTest extends WebProviderAuthTest {

	constructor (options) {
		super(options);
		this.doAccess = true;
	}
	
	get description () {
		return `should provide the appropriate redirect, when initiating an SSO authorization flow to ${this.provider}, and providing an access type, which should appear in the state payload`;
	}

	validateState (data) {
		const payload = super.validateState(data);
		Assert.strictEqual(payload.access, this.access, 'access not correct within state payload');
	}
}

module.exports = AccessTest;
