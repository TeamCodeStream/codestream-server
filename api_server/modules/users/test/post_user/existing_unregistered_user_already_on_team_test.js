'use strict';

const PostUserTest = require('./post_user_test');

class ExistingUnregisteredUserAlreadyOnTeamTest extends PostUserTest {

	constructor (options) {
		super(options);
		this.wantExistingUser = true;
		this.existingUserAlreadyOnTeam = true;
		this.noFirstInviteType = true;
	}

	get description () {
		return 'should return the user when inviting an unregistered user that is already on the team';
	}

}

module.exports = ExistingUnregisteredUserAlreadyOnTeamTest;
