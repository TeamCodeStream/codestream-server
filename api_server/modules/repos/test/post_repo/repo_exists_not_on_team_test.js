'use strict';

var RepoExistsTest = require('./repo_exists_test');

class RepoExistsNotOnTeamTest extends RepoExistsTest {

	constructor (options) {
		super(options);
		this.testOptions.dontIncludeCurrentUser = true;
	}

	get description () {
		return 'should return the repo when trying to create a repo that already exists and the user is not on the team (the user should be added to the team)';
	}
}

module.exports = RepoExistsNotOnTeamTest;
