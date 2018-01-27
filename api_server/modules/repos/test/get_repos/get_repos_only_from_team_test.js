'use strict';

var GetReposTest = require('./get_repos_test');

class GetReposOnlyFromTeamTest extends GetReposTest {

	get description () {
		return 'should return only the repos for the team i\'m a member of';
	}

	// set the path for the test request
	setPath (callback) {
		// include the id of the foreign repo in the request, the request should return
		// only the repos i requested that i have access to (i'm on the team that owns the repo)
		let ids = [
			this.myRepo._id,
			this.otherRepos[0]._id,
			this.foreignRepo._id
		];
		this.myRepos = [this.myRepo, this.otherRepos[0]];
		this.path = `/repos?teamId=${this.myTeam._id}&ids=${ids}`;
		callback();
	}
}

module.exports = GetReposOnlyFromTeamTest;
