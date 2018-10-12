'use strict';

const GetReposTest = require('./get_repos_test');

class GetReposByTeamTest extends GetReposTest {

	get description () {
		return 'should return repos in a team when requesting repos by team ID';
	}

	// set the path for the test request
	setPath (callback) {
		// i expect to fetch all repos owned by the team i'm on, including the one i created
		// and those created by others
		this.expectedRepos = this.postData.map(postData => postData.repos[0]);
		this.path = '/repos?teamId=' + this.team._id;
		callback();
	}
}

module.exports = GetReposByTeamTest;
