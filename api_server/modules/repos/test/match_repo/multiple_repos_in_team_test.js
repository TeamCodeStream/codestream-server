// base class for match-repo units tests

'use strict';

const MatchRepoTest = require('./match_repo_test');

class MultipleReposInTeamTest extends MatchRepoTest {

	constructor (options) {
		super(options);
		this.numTeams = 2;
		this.numReposPerTeam = 3;
		this.matches = [0, 2];
	}

	get description () {
		return 'should return the expected info when matching multiple repos in a team';
	}
}

module.exports = MultipleReposInTeamTest;
