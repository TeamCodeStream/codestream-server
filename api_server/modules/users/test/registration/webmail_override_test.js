'use strict';

const RegistrationTest = require('./registration_test');
const RandomString = require('randomstring');

class WebmailOverrideTest extends RegistrationTest {

	get description () {
		return 'request to register with a webmail address should succeed if checkForWebmail flag is not sent';
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.email = `${RandomString.generate(10)}@gmail.com`;
			callback();
		});
	}

}

module.exports = WebmailOverrideTest;
