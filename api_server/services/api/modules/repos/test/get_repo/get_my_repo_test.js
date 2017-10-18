'use strict';

var Get_Repo_Test = require('./get_repo_test');

class Get_My_Repo_Test extends Get_Repo_Test {

	get description () {
		return 'should return a valid repo when requesting a repo created by me';
	}

	set_path (callback) {
		this.path = '/repos/' + this.my_repo._id;
		callback();
	}

	validate_response (data) {
		this.validate_matching_object(this.my_repo._id, data.repo, 'repo');
		super.validate_response(data);
	}
}

module.exports = Get_My_Repo_Test;
