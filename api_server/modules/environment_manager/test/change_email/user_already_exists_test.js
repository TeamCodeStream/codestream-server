'use strict';

const ChangeEmailTest = require('./change_email_test');

class UserAlreadyExistsTest extends ChangeEmailTest {

	constructor (options) {
		super(options);
		this.userOptions.numUnregistered = 2;
	}

	get description () {
		return 'should return an error when trying to change a user\'s email across environments but a user with the email already exists';
	}

	getExpectedError () {
		return {
			code: 'USRC-1025'
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.toEmail = this.users[2].user.email;
			callback();
		});
	}
}

module.exports = UserAlreadyExistsTest;
