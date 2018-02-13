'use strict';

var ConfirmationTest = require('./confirmation_test');
var RandomString = require('randomstring');
var Assert = require('assert');

class PasswordUsernameTest extends ConfirmationTest {

	get description () {
		return 'should return valid user data and an access token when confirming with password and username for user who doesn\'t have them set yet';
	}

	// before the test runs...
	before (callback) {
		// suppress creating a username and password with the initial register call...
		this.userOptions = {
			noUsername: true,
			noPassword: true
		};
		super.before(error => {
			if (error) { return callback(error); }
			// ...and set username and password in the confirm call
			this.data.username = RandomString.generate(12);
			this.data.password = RandomString.generate(12);
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		// validate that we see the username we sent in the request (we won't see the password because it's sanitized out)
		Assert(data.user.username === this.data.username, 'username doesn\'t match');
		super.validateResponse(data);
	}
}

module.exports = PasswordUsernameTest;
