'use strict';

const InviteCodeDifferentEmailTest = require('./invite_code_different_email_test');

class AlreadyInvitedTest extends InviteCodeDifferentEmailTest {

	constructor (options) {
		super(options);
		this.teamOptions.numAdditionalInvites = 1;
	}

	get description () {
		return 'should return an error if a user tries to register with an invite code using a different email than the invite code was created for, and a user with that email has already been invited';
	}

	getExpectedError () {
		return {
			code: 'USRC-1020'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			// intead of creating a random email, we'll use the email for an already invited user
			this.data.email = this.users[2].user.email;
			callback();
		});
	}

}

module.exports = AlreadyInvitedTest;
