'use strict';

var RegistrationTest = require('./registration_test');
var RandomString = require('randomstring');
//const ApiConfig = require(process.env.CS_API_TOP + '/config/api.js');

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
			info: [{
				password: 'must be at least six characters'
			}]
		};
	}

	// before the test runs...
	before (callback) {
		// generate random user data, but a password that is too short
		this.data = this.userFactory.getRandomUserData();
		this.data.password = RandomString.generate(5);
		callback();
	}
}

module.exports = BadPasswordTest;
