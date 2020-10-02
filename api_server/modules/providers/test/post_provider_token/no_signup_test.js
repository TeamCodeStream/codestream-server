'use strict';

const PostProviderTokenTest = require('./post_provider_token_test');

class NoSignUpTest extends PostProviderTokenTest {

	constructor (options) {
		super(options);
		this.runRequestAsTest = true;
	}

	get description () {
		return `should return an error when setting a ${this.provider} token with no signup and a matching email is not found`;
	}

	getExpectedError() {
		return {
			code: 'PRVD-1005'
		};
	}

	getRequestBody () {
		const body = super.getRequestBody();
		body.no_signup = true;
		return body;
	}
}

module.exports = NoSignUpTest;
