'use strict';

const LoginByCodeTest = require('./login_by_code_test');

class MissingParametersTest extends LoginByCodeTest {

	get description () {
		return 'should return an error when using an invalid code';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'email,loginCode'
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { callback(error); }
			this.data = {};
			callback();
		});
	}
}

module.exports = MissingParametersTest;
