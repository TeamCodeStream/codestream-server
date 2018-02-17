'use strict';

var RegistrationTest = require('./registration_test');
var RandomString = require('randomstring');
//const ApiConfig = require(process.env.CS_API_TOP + '/config/api.js');

class BadUsernameTest extends RegistrationTest {

	get description () {
		return 'should return an invalid username error when registering with a bad username';
	}

	getExpectedFields () {
		return null;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
   			info: [{
				username: 'can only contain .*'
			}]
		};
	}

	before (callback) {
		this.data = this.userFactory.getRandomUserData();
		this.data.username = RandomString.generate(12) + '%';
//		this.data.betaCode = ApiConfig.testBetaCode;	// overrides needing a true beta code
		callback();
	}
}

module.exports = BadUsernameTest;
