'use strict';

var GetReposTest = require('./get_repos_test');

class GetReposByTeamTest extends GetReposTest {

	get description () {
		return 'should return repos in a team when requesting repos by team ID';
	}

	setPath (callback) {
		this.myRepos = [this.myRepo, ...this.otherRepos];
		this.path = '/repos?teamId=' + this.myTeam._id;
		callback();
	}
}

module.exports = GetReposByTeamTest;
