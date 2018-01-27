'use strict';

var AlreadyOnTeamTest = require('./already_on_team_test');

class AlreadyOnTeamAddUsersTest extends AlreadyOnTeamTest {

	get description () {
		return 'should return the new repo when trying to add a repo to an existing team that the user is already on, including adding new users';
	}

	// make data to use in the request
	makeRepoData (callback) {
		// create some registered and unregistered users to try to add when creating the repo, 
		// these will get added to the request
		this.createMixedUsers(error => {
			if (error) { return callback(error); }
			this.otherRepoOptions = {};
			super.makeRepoData(callback);
		});
	}
}

module.exports = AlreadyOnTeamAddUsersTest;
