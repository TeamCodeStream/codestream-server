'use strict';

const ClaimCodeErrorTest = require('./claim_code_error_test');

class ParameterRequiredTest extends ClaimCodeErrorTest {

	get description () {
		return `should return an error when trying to claim a code error without providing ${this.parameter}`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: this.parameter
		};
	}

	init (callback) {
		super.init(error => {
			if (error) { return callback(error); }
			delete this.data[this.parameter];
			callback();
		});
	}
}

module.exports = ParameterRequiredTest;
