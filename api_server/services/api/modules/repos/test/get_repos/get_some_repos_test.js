'use strict';

var Get_Repos_Test = require('./get_repos_test');

class Get_Some_Repos_Test extends Get_Repos_Test {

	get description () {
		return 'should return the correct repos when requesting repos by ID';
	}

	set_path (callback) {
		this.path = `/repos?ids=${this.my_repo._id},${this.other_repos[0]._id},${this.other_repos[2]._id}`;
		callback();
	}

	validate_response (data) {
		let my_repos = [this.my_repo, this.other_repos[0], this.other_repos[2]];
		this.validate_matching_objects(my_repos, data.repos, 'repos');
		super.validate_response(data);
	}
}

module.exports = Get_Some_Repos_Test;
