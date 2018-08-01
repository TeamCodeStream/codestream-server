'use strict';

const RemoveUsersTest = require('./remove_users_test');

class NoRemoveUserAndAddAdminTest extends RemoveUsersTest {

	get description () {
		return 'should return an error when trying to update a team with a simultaneous member removal and addition of admin';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005'
		};
	}

	// before the test runs...
	makeTeamData (callback) {
		super.makeTeamData(() => {
			this.data.$push = { adminIds: this.otherUserData[2].user._id };
			callback();
		});
	}
}

module.exports = NoRemoveUserAndAddAdminTest;
