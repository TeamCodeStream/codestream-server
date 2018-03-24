'use strict';

const PostUserTest = require('./post_user_test');

class ExistingRegisteredUserAlreadyOnTeamTest extends PostUserTest {

	constructor (options) {
		super(options);
		this.wantExistingUser = true;
		this.existingUserIsRegistered = true;
		this.existingUserAlreadyOnTeam = true;
	}

	get description () {
		return 'should return the user when inviting a registered user that is already on the team';
	}

}

module.exports = ExistingRegisteredUserAlreadyOnTeamTest;
