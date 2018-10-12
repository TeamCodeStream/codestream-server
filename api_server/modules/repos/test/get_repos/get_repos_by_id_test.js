'use strict';

const GetReposTest = require('./get_repos_test');

class GetReposByIdTest extends GetReposTest {

	get description () {
		return 'should return the correct repos when requesting repos by ID';
	}

	// set the path for the test request
	setPath (callback) {
		// i am a member of both teams owning these repos, so i should be able to fetch both
		this.expectedRepos = [this.postData[0].repos[0], this.postData[2].repos[0]];
		let ids = this.expectedRepos.map(repo => repo._id);
		this.path = `/repos?teamId=${this.team._id}&ids=${ids}`;
		callback();
	}
}

module.exports = GetReposByIdTest;
