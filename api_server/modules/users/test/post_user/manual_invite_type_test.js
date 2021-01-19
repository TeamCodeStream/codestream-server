'use strict';

const PostUserTest = require('./post_user_test');
const RandomString = require('randomstring');

class ManualInviteTypeTest extends PostUserTest {

	get description () {
		return 'when inviting a user with a manual invite type, lastInviteType for the user should be set to the manually provided value';
	}

	// form the data for the user update
	makeUserData (callback) {
		// set a manual invite type
		this.firstInviteType = this.lastInviteType = RandomString.generate(10);
		super.makeUserData(() => {
			this.data.inviteType = this.lastInviteType;
			callback();
		});
	}
}

module.exports = ManualInviteTypeTest;
