'use strict';

const PostProviderTokenTest = require('./post_provider_token_test');

class InvalidTokenTest extends PostProviderTokenTest {

	constructor(options) {
		super(options);
		this.runRequestAsTest = true;
	}

	get description () {
		return `should return an error and return a signup token with an error when setting a ${this.provider} token and the provided access token is not valid`;
	}

	getExpectedError() {
		return {
			code: 'PRVD-1001'
		};
	}
	
	getRequestBody () {
		const body = super.getRequestBody();
		body.token = 'invalid-token';
		return body;
	}
}

module.exports = InvalidTokenTest;
