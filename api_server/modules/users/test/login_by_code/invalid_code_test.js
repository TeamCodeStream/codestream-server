'use strict';

const LoginByCodeTest = require('./login_by_code_test');

class InvalidCodeTest extends LoginByCodeTest {

	get description () {
		return 'should return an error when using an invalid code';
	}

	getExpectedError () {
		return {
			code: 'USRC-1027'
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { callback(error); }
			this.data.loginCode = '000000';	// 000000 is never a valid code
			callback();
		});
	}
}

module.exports = InvalidCodeTest;
