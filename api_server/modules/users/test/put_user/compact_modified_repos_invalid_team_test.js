'use strict';

const ModifiedReposInvalidTeamTest = require('./modified_repos_invalid_team_test');

class CompactModifiedReposInvalidTeamTest extends ModifiedReposInvalidTeamTest {

	constructor(options) {
		super(options);
		this.setCompactModifiedRepos = true;
	}
}

module.exports = CompactModifiedReposInvalidTeamTest;
