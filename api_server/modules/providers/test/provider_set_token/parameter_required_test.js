'use strict';

const ProviderSetTokenTest = require('./provider_set_token_test');

class ParameterRequiredTest extends ProviderSetTokenTest {

	get description () {
		return `should return an error when trying to add a provider token and the ${this.parameter} parameter is not specified`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: this.parameter
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(); }
			delete this.data[this.parameter];
			callback();
		});
	}
}

module.exports = ParameterRequiredTest;
