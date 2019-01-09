'use strict';

const ProviderRefreshTest = require('./provider_refresh_test');

class ParameterRequiredTest extends ProviderRefreshTest {

	constructor (options) {
		super(options);
		this.runRequestAsTest = true;
	}

	get description () {
		return `should return an error when attempting to refresh the token for a provider without supplying ${this.parameter}`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: this.parameter
		};
	}

	getQueryParameters () {
		const parameters = super.getQueryParameters();
		delete parameters[this.parameter];
		return parameters;
	}
}

module.exports = ParameterRequiredTest;
