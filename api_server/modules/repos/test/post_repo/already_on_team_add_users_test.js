'use strict';

var AlreadyOnTeamTest = require('./already_on_team_test');

class AlreadyOnTeamAddUsersTest extends AlreadyOnTeamTest {

	get description () {
		return 'should return the new repo when trying to add a repo to an existing team that the user is already on, including adding new users';
	}

	makeRepoData (callback) {
		this.createMixedUsers(error => {
			if (error) { return callback(error); }
			this.otherRepoOptions = {};
			super.makeRepoData(callback);
		});
	}
}

module.exports = AlreadyOnTeamAddUsersTest;
