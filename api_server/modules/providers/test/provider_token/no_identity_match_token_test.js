'use strict';

const IdentityMatchErrorTest = require('./identity_match_error_test');

class NoIdentityMatchTokenTest extends IdentityMatchErrorTest {

	constructor (options) {
		super(options);
		this.expectError = 'RAPI-1010';
	}

	get description () {
		return `should redirect to an error page and return a signup token with an error when completing a ${this.provider} authorization flow and the provider does not return an access token`;
	}

	getQueryParameters () {
		const parameters = super.getQueryParameters();
		parameters._mockToken = 'noToken';
		return parameters;
	}
}

module.exports = NoIdentityMatchTokenTest;
