'use strict';

const RegistrationTest = require('./registration_test');
const RandomString = require('randomstring');

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
			info: {
				email: 'invalid email'
			}
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			// generate random user data, but a bad email (no '@')
			this.data.email = RandomString.generate(12);
			callback();
		});
	}
}

module.exports = BadEmailTest;
