'use strict';

var GetReposTest = require('./get_repos_test');

class GetReposByIdTest extends GetReposTest {

	get description () {
		return 'should return the correct repos when requesting repos by ID';
	}

	setPath (callback) {
		this.myRepos = [this.myRepo, this.otherRepos[1]];
		let ids = this.myRepos.map(repo => repo._id);
		this.path = `/repos?teamId=${this.myTeam._id}&ids=${ids}`;
		callback();
	}
}

module.exports = GetReposByIdTest;
