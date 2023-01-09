'use strict';

const ConfirmationTest = require('./confirmation_test');

class UnknownUserTest extends ConfirmationTest {

	get description () {
		return `should return an error when confirming with an email that does not match an existing unregistered user, under one-user-per-org paradigm`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'user'
		};
	}

	// before the test runs...
	before (callback) {
		// run the standard setup for a confirmation, but put in a random uid
		super.before(error => {
			if (error) { return callback(error); }
			this.data.email = this.userFactory.randomEmail();
			callback();
		});
	}
}

module.exports = UnknownUserTest;
