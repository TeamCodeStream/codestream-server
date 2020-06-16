'use strict';

const IdentityMatchErrorTest = require('./identity_match_error_test');

class NoSignUpTest extends IdentityMatchErrorTest {

	constructor (options) {
		super(options);
		this.expectError = 'PRVD-1005';
	}

	get description () {
		return `should redirect to an error page and return a signup token with an error when completing a ${this.provider} authorization flow when a matching email is not found`;
	}

	// get parameter to use in the provider-auth request that kicks the authentication off
	getProviderAuthParameters () {
		const parameters = super.getProviderAuthParameters();
		parameters.noSignup = true;
		return parameters;
	}
}

module.exports = NoSignUpTest;
