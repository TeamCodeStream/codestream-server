'use strict';

var LoginTest = require('./login_test');

class InvalidPasswordTest extends LoginTest {

	get description () {
		return 'should return error when invalid password provided';
	}

	getExpectedFields () {
		return null;
	}

	getExpectedError () {
		return {
			code: 'USRC-1001'
		};
	}

	before (callback) {
		super.before((error) => {
			if (error) { return callback(error); }
			this.data.password += 'x';
			callback();
		});
	}
}

module.exports = InvalidPasswordTest;
