'use strict';

var GetReposTest = require('./get_repos_test');

class GetReposByIdTest extends GetReposTest {

	get description () {
		return 'should return the correct repos when requesting repos by ID';
	}

	// set the path for the test request
	setPath (callback) {
		// i am a member of both teams owning these repos, so i should be able to fetch both
		this.myRepos = [this.myRepo, this.otherRepos[1]];
		let ids = this.myRepos.map(repo => repo._id);
		this.path = `/repos?teamId=${this.myTeam._id}&ids=${ids}`;
		callback();
	}
}

module.exports = GetReposByIdTest;
