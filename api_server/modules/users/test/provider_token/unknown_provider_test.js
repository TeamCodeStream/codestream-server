'use strict';

const ProviderTokenTest = require('./provider_token_test');

class UnknownProviderTest extends ProviderTokenTest {

	constructor (options) {
		super(options);
		this.runRequestAsTest = true;
		this.provider = 'blahblah';
	}

	get description () {
		return 'should return an error when completing authorization flow for an unknown provider';
	}

	getExpectedError () {
		return {
			code: 'USRC-1013'
		};
	}
}

module.exports = UnknownProviderTest;
