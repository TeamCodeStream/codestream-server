'use strict';

const RegistrationTest = require('./registration_test');
const RandomString = require('randomstring');

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
			info: {
				username: 'can only contain .*'
			}
		};
	}

	before (callback) {
		super.before(error => {
			// generate random user data, but a username with a bad character
			if (error) { return callback(error); }
			this.data.username = RandomString.generate(12) + '%';
			callback();
		});
	}
}

module.exports = BadUsernameTest;
