'use strict';

const PostProviderTokenTest = require('./post_provider_token_test');

class InvalidProviderTest extends PostProviderTokenTest {

	constructor(options) {
		super(options);
		this.runRequestAsTest = true;
		this.provider = 'jira';
	}

	get description() {
		return 'should return an error when setting a provider token for a provider that is not allowed';
	}

	getExpectedError() {
		return {
			code: 'PRVD-1011'
		};
	}
}

module.exports = InvalidProviderTest;
