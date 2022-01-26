'use strict';

const ConfirmUserTest = require('./confirm_user_test');
const Assert = require('assert');
const RandomString = require('randomstring');

class UsernameTest extends ConfirmUserTest {

	get description () {
		return 'should be able to set a username when submitting a request to confirm a user';
	}

	// before the test runs...
	before (callback) {
		// set a new username in the request body
		super.before(error => {
			if (error) { return callback(error); }
			this.data.username = RandomString.generate(12);
			callback();
		});
	}

	validateResponse (data) {
		Assert.deepStrictEqual(data.user.username, this.data.username, 'username not set');
	}
}

module.exports = UsernameTest;
