'use strict';

var Get_Repos_Test = require('./get_repos_test');

class Get_Repos_Only_From_Team_Test extends Get_Repos_Test {

	get description () {
		return 'should return only the repos for the team i\'m a member of';
	}

	set_path (callback) {
		let ids = [
			this.my_repo._id,
			this.other_repos[0]._id,
			this.foreign_repo._id
		];
		this.my_repos = [this.my_repo, this.other_repos[0]];
		this.path = `/repos?team_id=${this.my_team._id}&ids=${ids}`;
		callback();
	}
}

module.exports = Get_Repos_Only_From_Team_Test;
