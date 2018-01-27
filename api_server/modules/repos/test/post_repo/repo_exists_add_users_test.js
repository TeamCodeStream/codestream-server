'use strict';

var RepoExistsTest = require('./repo_exists_test');

class RepoExistsAddUsersTest extends RepoExistsTest {

	get description () {
		return 'should return the repo when trying to add a repo that already exists and the user is on the team, including adding new users';
	}

	// make the data to be used when making the POST /repos request
	makeRepoData (callback) {
		// create some registered and unregistered users, to be added in the request
		this.createMixedUsers(error => {
			if (error) { return callback(error); }
			this.otherRepoOptions = {};
			super.makeRepoData(callback);
		});
	}
}

module.exports = RepoExistsAddUsersTest;
