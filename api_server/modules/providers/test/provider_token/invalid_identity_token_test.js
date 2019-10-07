'use strict';

const IdentityMatchErrorTest = require('./identity_match_error_test');

class InvalidIdentityTokenTest extends IdentityMatchErrorTest {

	constructor (options) {
		super(options);
		this.expectError = 'PRVD-1001';
	}

	get description () {
		return `should redirect to an error page and return a signup token with an error when completing a ${this.provider} authorization flow and the provided access token is not valid`;
	}

	getQueryParameters () {
		const parameters = super.getQueryParameters();
		parameters._mockToken = 'invalid-token';
		return parameters;
	}
}

module.exports = InvalidIdentityTokenTest;
