'use strict';

const ProviderDeauthTest = require('./provider_deauth_test');

class DeauthHostTest extends ProviderDeauthTest {

	constructor (options) {
		super(options);
		this.includeHost = true;
	}

	get description () {
		return `should clear the access token and associated data for the user when deauthorizing against a specific host for ${this.provider}`;
	}
}

module.exports = DeauthHostTest;
