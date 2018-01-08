'use strict';

var ConfirmationTest = require('./confirmation_test');
var RandomString = require('randomstring');
var Assert = require('assert');

class PasswordUsernameTest extends ConfirmationTest {

	get description () {
		return 'should return valid user data and an access token when confirming with password and username for user who doesn\'t have them set yet';
	}

	before (callback) {
		this.userOptions = {
			noUsername: true,
			noPassword: true
		};
		super.before(error => {
			if (error) { return callback(error); }
			this.data.username = RandomString.generate(12);
			this.data.password = RandomString.generate(12);
			callback();
		});
	}

	validateResponse (data) {
		Assert(data.user.username === this.data.username, 'username doesn\'t match');
		super.validateResponse(data);
	}
}

module.exports = PasswordUsernameTest;
