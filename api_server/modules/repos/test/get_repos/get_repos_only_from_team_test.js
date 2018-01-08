'use strict';

var GetReposTest = require('./get_repos_test');

class GetReposOnlyFromTeamTest extends GetReposTest {

	get description () {
		return 'should return only the repos for the team i\'m a member of';
	}

	setPath (callback) {
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
