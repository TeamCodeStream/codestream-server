'use strict';

const PostUserTest = require('./post_user_test');

class ExistingRegisteredUserOnTeamTest extends PostUserTest {

	constructor (options) {
		super(options);
		this.wantExistingUser = true;
		this.existingUserIsRegistered = true;
		this.existingUserOnTeam = true;
	}

	get description () {
		return 'should return the user when inviting a user that already exists and is registered and is already on another team';
	}

}

module.exports = ExistingRegisteredUserOnTeamTest;
