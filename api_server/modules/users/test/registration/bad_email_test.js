'use strict';

var RegistrationTest = require('./registration_test');
var RandomString = require('randomstring');

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

	before (callback) {
		this.data = this.userFactory.getRandomUserData();
		this.data.email = RandomString.generate(12);
		callback();
	}
}

module.exports = BadEmailTest;
