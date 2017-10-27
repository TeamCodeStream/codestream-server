'use strict';

var Get_Repos_Test = require('./get_repos_test');

class Get_Repos_By_Id_Test extends Get_Repos_Test {

	get description () {
		return 'should return the correct repos when requesting repos by ID';
	}

	set_path (callback) {
		this.my_repos = [this.my_repo, this.other_repos[1]];
		let ids = this.my_repos.map(repo => repo._id);
		this.path = `/repos?team_id=${this.my_team._id}&ids=${ids}`;
		callback();
	}
}

module.exports = Get_Repos_By_Id_Test;
