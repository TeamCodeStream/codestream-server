'use strict';

const ProviderTokenTest = require('./provider_token_test');

class InvalidTokenTest extends ProviderTokenTest {

	constructor (options) {
		super(options);
		this.runRequestAsTest = true;
	}

	get description () {
		return 'should return an error when completing a third-party provider authorization flow and the state token is not valid';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1002'
		};
	}

	getQueryParameters () {
		const parameters = super.getQueryParameters();
		parameters.state = 'xyz';
		return parameters;
	}
}

module.exports = InvalidTokenTest;
