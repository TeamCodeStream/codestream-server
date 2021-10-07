'use strict';

const RegistrationTest = require('./registration_test');
const RandomString = require('randomstring');

class WebmailTest extends RegistrationTest {

	get description () {
		return 'should return an emailIsWebmail error if a user tries to register with an email that is a webmail address, and checkForWebmail flag is set';
	}

	getExpectedError () {
		return {
			code: 'USRC-1026'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.checkForWebmail = true;
			this.data.email = `${RandomString.generate(10)}@gmail.com`;
			callback();
		});
	}

}

module.exports = WebmailTest;
