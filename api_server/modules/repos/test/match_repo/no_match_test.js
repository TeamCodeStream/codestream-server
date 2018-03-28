// base class for match-repo units tests

'use strict';

const MatchRepoTest = require('./match_repo_test');

class NoMatchTest extends MatchRepoTest {

	constructor (options) {
		super(options);
		this.numTeams = 2;
		this.numReposPerTeam = 2;
		this.matches = [];
	}

	get description () {
		return 'should return empty info when there is no match found for a repo';
	}
}

module.exports = NoMatchTest;
