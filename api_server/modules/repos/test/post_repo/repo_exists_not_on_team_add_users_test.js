'use strict';

var RepoExistsAddUsersTest = require('./repo_exists_add_users_test');

class RepoExistsNotOnTeamAddUsersTest extends RepoExistsAddUsersTest {

	constructor (options) {
		super(options);
		this.testOptions.dontIncludeCurrentUser = true;
	}

	get description () {
		return 'should return the repo when trying to create a repo that already exists and the user is not on the team, and the user adds other users (the user and other users should be added to the team)';
	}

	validateResponse (data) {
		this.teamEmails.push(this.currentUser.email);
		super.validateResponse(data);
	}
}

module.exports = RepoExistsNotOnTeamAddUsersTest;
