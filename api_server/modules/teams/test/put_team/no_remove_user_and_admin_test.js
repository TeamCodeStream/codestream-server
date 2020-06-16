'use strict';

const RemoveAdminsTest = require('./remove_admins_test');

class NoRemoveUserAndAdminTest extends RemoveAdminsTest {

	get description () {
		return 'should return an error when trying to update a team with a simultaneous member removal and removal as admin';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005'
		};
	}

	// before the test runs...
	makeTeamData (callback) {
		super.makeTeamData(() => {
			this.data.$addToSet = { removedMemberIds: this.users[2].user.id };
			callback();
		});
	}
}

module.exports = NoRemoveUserAndAdminTest;
