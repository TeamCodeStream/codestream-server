'use strict';

const GetReposTest = require('./get_repos_test');

class GetReposOnlyFromTeamTest extends GetReposTest {

	get description () {
		return 'should return only the repos for the team i\'m a member of';
	}

	// set the path for the test request
	setPath (callback) {
		// include the id of the foreign repo in the request, the request should return
		// only the repos i requested that i have access to (i'm on the team that owns the repo)
		const ids = [
			this.postData[0].repos[0].id,
			this.postData[2].repos[0].id,
			this.foreignRepo.id
		];
		this.expectedRepos = [this.postData[0].repos[0], this.postData[2].repos[0]];
		this.path = `/repos?teamId=${this.team.id}&ids=${ids}`;
		callback();
	}
}

module.exports = GetReposOnlyFromTeamTest;
