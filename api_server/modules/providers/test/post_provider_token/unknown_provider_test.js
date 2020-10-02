'use strict';

const PostProviderTokenTest = require('./post_provider_token_test');

class UnknownProviderTest extends PostProviderTokenTest {

	constructor (options) {
		super(options);
		this.runRequestAsTest = true;
		this.provider = 'blahblah';
	}

	get description () {
		return 'should return an error when setting a provider token for an unknown provider';
	}

	getExpectedError() {
		return {
			code: 'PRVD-1000'
		};
	}
}

module.exports = UnknownProviderTest;
