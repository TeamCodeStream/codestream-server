'use strict';

var RepoExistsTest = require('./repo_exists_test');

class RepoExistsNotOnTeamTest extends RepoExistsTest {

	constructor (options) {
		super(options);
		// don't include the current user in creating the repo and team the first time,
		// but since the user has the correct first commit hash for the repo, they should
		// be permitted to "create" the repo and as a consequence get added to the team
		// that already owns the repo
		this.testOptions.dontIncludeCurrentUser = true;
		this.testOptions.teamNotRequired = false;	// in this case we should see the full team object in the response
	}

	get description () {
		return 'should return the repo when trying to create a repo that already exists and the user is not on the team (the user should be added to the team)';
	}
}

module.exports = RepoExistsNotOnTeamTest;
