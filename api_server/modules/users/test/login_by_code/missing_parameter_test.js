'use strict';

const LoginByCodeTest = require('./login_by_code_test');

class MissingParameterTest extends LoginByCodeTest {

	get description () {
		return `should return an error a login-by-code request is made with no ${this.parameter}`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: this.parameter
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { callback(error); }
			delete this.data[this.parameter];
			callback();
		});
	}
}

module.exports = MissingParameterTest;
