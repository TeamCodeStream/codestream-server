// base class for match-repo units tests

'use strict';

const MatchRepoTest = require('./match_repo_test');

class MultipleTeamsMatchingRepoTest extends MatchRepoTest {

	constructor (options) {
		super(options);
		this.numTeams = 3;
		this.numReposPerTeam = 3;
		this.matches = [1, 3, 5];
	}

	get description () {
		return 'should return the expected info when matching repos across multiple team';
	}
}

module.exports = MultipleTeamsMatchingRepoTest;
