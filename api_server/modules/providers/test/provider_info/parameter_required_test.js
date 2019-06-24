'use strict';

const ProviderInfoTest = require('./provider_info_test');

class ParameterRequiredTest extends ProviderInfoTest {

	get description () {
		return `should return an error when trying to set provider info and the ${this.parameter} parameter is not specified`;
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
