'use strict';

var Get_Repos_Test = require('./get_repos_test');

class Get_Repos_By_Team_Test extends Get_Repos_Test {

	get description () {
		return 'should return repos in a team when requesting repos by team ID';
	}

	set_path (callback) {
		let repo = this.other_repos[2];
		this.team_id = repo.team_id;
		this.my_repos = this.other_repos.filter(repo => repo.team_id === this.team_id);
		this.path = '/repos?team_id=' + this.team_id;
		callback();
	}
}

module.exports = Get_Repos_By_Team_Test;
