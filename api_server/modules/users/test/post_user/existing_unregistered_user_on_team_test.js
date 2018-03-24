'use strict';

const PostUserTest = require('./post_user_test');

class ExistingUnegisteredUserOnTeamTest extends PostUserTest {

	constructor (options) {
		super(options);
		this.wantExistingUser = true;
		this.existingUserOnTeam = true;
	}

	get description () {
		return 'should return the user when inviting a user that already exists but is not registered, and is already on another team';
	}

}

module.exports = ExistingUnegisteredUserOnTeamTest;
