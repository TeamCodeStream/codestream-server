'use strict';

const PostProviderTokenTest = require('./post_provider_token_test');

class BadProviderIdentityMatchTest extends PostProviderTokenTest {

	constructor (options) {
		super(options);
		this.runRequestAsTest = true;
	}

	get description () {
		return `should return an error when setting a ${this.provider} token and the provider is not an identity matching provider`;
	}

	getExpectedError() {
		return {
			code: 'PRVD-1011'
		};
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
