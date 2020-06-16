'use strict';

const IdentityMatchErrorTest = require('./identity_match_error_test');

class BadProviderIdentityMatchTest extends IdentityMatchErrorTest {

	constructor (options) {
		super(options);
		this.expectError = 'PRVD-1004';
	}

	get description () {
		return `should redirect to an error page and return a signup token with an error when completing a ${this.provider} authorization flow and the provider is not an identity matching provider`;
	}

	setProviderToken (callback) {
		this.realProvider = this.provider;
		this.provider = 'trello';
		super.setProviderToken(error => {
			if (error) { return callback(error); }
			this.provider = this.realProvider;
			callback();
		});
	}
}

module.exports = BadProviderIdentityMatchTest;
