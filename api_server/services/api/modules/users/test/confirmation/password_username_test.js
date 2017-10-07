'use strict';

var Confirmation_Test = require('./confirmation_test');
var Random_String = require('randomstring');
var Assert = require('assert');

class Password_Username_Test extends Confirmation_Test {

	get_description () {
		return 'should return valid user data and an access token when confirming with password and username for user who doesn\'t have them set yet';
	}

	before (callback) {
		this.user_options = {
			no_username: true,
			no_password: true
		};
		super.before(error => {
			if (error) { return callback(error); }
			this.data.username = Random_String.generate(12);
			this.data.password = Random_String.generate(12);
			callback();
		});
	}

	validate_response (data) {
		Assert(data.user.username === this.data.username, 'username doesn\'t match');
		super.validate_response(data);
	}
}

module.exports = Password_Username_Test;
