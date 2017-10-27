'use strict';

var Get_Repos_Test = require('./get_repos_test');

class Get_Repos_By_Team_Test extends Get_Repos_Test {

	get description () {
		return 'should return repos in a team when requesting repos by team ID';
	}

	set_path (callback) {
		this.my_repos = [this.my_repo, ...this.other_repos];
		this.path = '/repos?team_id=' + this.my_team._id;
		callback();
	}
}

module.exports = Get_Repos_By_Team_Test;
