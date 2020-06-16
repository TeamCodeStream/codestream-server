'use strict';

const PostUserTest = require('./post_user_test');
const EmailUtilities = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/email_utilities');

class UsernameResolutionTest extends PostUserTest {

	constructor (options) {
		super(options);
		this.wantOtherUser = true;
	}

	get description () {
		return 'when inviting a new user, and the first part of the user\'s email has a username conflict with another user on the team, the username conflict should be resolved by appending a numeral to the assigned username of the new user';
	}

	// form the data for the user update
	makeUserData (callback) {
		// substitute an email matching an existing user's username
		super.makeUserData(() => {
			const domain = EmailUtilities.parseEmail(this.data.email).domain;
			const existingUsername = this.users[1].user.username;
			this.data.email = `${existingUsername}@${domain}`;
			const appendedNumber = (this.numConflictingUsers || 0) + 1;
			this.expectedUsername = `${existingUsername}${appendedNumber}`;
			callback();
		});
	}
}

module.exports = UsernameResolutionTest;
