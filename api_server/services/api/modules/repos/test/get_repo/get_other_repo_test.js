'use strict';

var Get_Repo_Test = require('./get_repo_test');

class Get_Other_Repo_Test extends Get_Repo_Test {

	get description () {
		return 'should return a valid repo when requesting a repo created by another user on a team that i am on';
	}

	set_path (callback) {
		this.path = '/repos/' + this.other_repo._id;
		callback();
	}

	validate_response (data) {
		this.validate_matching_object(this.other_repo._id, data.repo, 'repo');
		super.validate_response(data);
	}
}

module.exports = Get_Other_Repo_Test;
