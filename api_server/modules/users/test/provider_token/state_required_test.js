'use strict';

const ProviderTokenTest = require('./provider_token_test');

class StateRequiredTest extends ProviderTokenTest {

	constructor (options) {
		super(options);
		this.runRequestAsTest = true;
	}

	get description () {
		return 'should return an error when completing authorization flow for a third-party provider and no state parameter is sent';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'state'
		};
	}

	getQueryParameters () {
		const parameters = super.getQueryParameters();
		delete parameters.state;
		return parameters;
	}
}

module.exports = StateRequiredTest;
