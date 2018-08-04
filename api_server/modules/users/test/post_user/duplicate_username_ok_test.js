'use strict';

const PostUserTest = require('./post_user_test');
const RandomString = require('randomstring');

class DuplicateUsernameOkTest extends PostUserTest {

	constructor (options) {
		super(options);
		this.wantExistingUser = true;
		this.existingUserUsername = RandomString.generate(8); 
		this.existingUserOnTeam = true;
		this.teamCreatorUsername = this.existingUserUsername;
		this.existingUserIsRegistered = true;
	}

	get description () {
		return 'when inviting a registered user to a team, and that user has the same username as a user on the team, we tolerate the duplicate username instead of throwing an error';
	}
}

module.exports = DuplicateUsernameOkTest;
