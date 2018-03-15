'use strict';

var RegistrationTest = require('./registration_test');
var RandomString = require('randomstring');
//const ApiConfig = require(process.env.CS_API_TOP + '/config/api.js');

class BadEmailTest extends RegistrationTest {

	get description () {
		return 'should return an invalid email error when registering with a bad email';
	}

	getExpectedFields () {
		return null;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: [{
				email: 'invalid email'
			}]
		};
	}

	// before the test runs...
	before (callback) {
		// generate random user data, but a bad email (no '@')
		this.data = this.userFactory.getRandomUserData();
		this.data.email = RandomString.generate(12);
		// this.data.betaCode = ApiConfig.testBetaCode; // overrides needing a true beta code
		callback();
	}
}

module.exports = BadEmailTest;
