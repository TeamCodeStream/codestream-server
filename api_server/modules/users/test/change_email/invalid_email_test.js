'use strict';

const ChangeEmailTest = require('./change_email_test');
const RandomString = require('randomstring');

class InvalidEmailTest extends ChangeEmailTest {

	get description () {
		return 'should return an error when submitting a request to change email with an invalid email provided';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'invalid email'
		};
	}

	// before the test runs...
	before (callback) {
		// change the email from the data to submit with the request, to a bogus email
		super.before(error => {
			if (error) { return callback(error); }
			this.data.email = RandomString.generate();
			callback();
		});
	}
}

module.exports = InvalidEmailTest;
