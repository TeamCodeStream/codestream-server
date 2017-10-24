'use strict';

var Get_Repo_Test = require('./get_repo_test');

class ACL_Test extends Get_Repo_Test {

	constructor (options) {
		super(options);
		this.without_me = true;
	}

	get description () {
		return 'should return an error when trying to fetch a repo for a team that i\'m not a member of';
	}

	get_expected_error () {
		return {
			code: 'RAPI-1009'
		};
	}

	set_path (callback) {
		this.path = '/repos/' + this.other_repo._id;
		callback();
	}
}

module.exports = ACL_Test;
