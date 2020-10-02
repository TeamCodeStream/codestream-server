'use strict';

const PostProviderTokenTest = require('./post_provider_token_test');

class TokenRequiredTest extends PostProviderTokenTest {

	constructor (options) {
		super(options);
		this.runRequestAsTest = true;
	}

	get description () {
		return 'should return an error when attempting to set a provider token but no access token is sent';
	}

	getExpectedError() {
		return {
			code: 'RAPI-1001'
		};
	}

	getRequestBody () {
		const body = super.getRequestBody();
		delete body.token;
		return body;
	}
}

module.exports = TokenRequiredTest;
