'use strict';

const RegistrationTest = require('./registration_test');
const RandomString = require('randomstring');

class BadPasswordTest extends RegistrationTest {

	get description () {
		return 'should return an invalid password error when registering with a bad password';
	}

	getExpectedFields () {
		return null;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: {
				password: 'must be at least six characters'
			}
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			// generate random user data, but a password that is too short
			this.data.password = RandomString.generate(5);
			callback();
		});
	}
}

module.exports = BadPasswordTest;
