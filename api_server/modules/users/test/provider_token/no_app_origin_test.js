'use strict';

const ProviderTokenTest = require('./provider_token_test');

class NoAppOriginTest extends ProviderTokenTest {

	constructor (options) {
		super(options);
		this.runRequestAsTest = true;
		this.excludeAppOrigin = true;
	}

	get description () {
		return 'should return an error when completing a third-party provider authorization flow for enterprise and the state token does not include an app origin';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010'
		};
	}
}

module.exports = NoAppOriginTest;
