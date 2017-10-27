'use strict';

var Get_Repos_Test = require('./get_repos_test');

class ACL_Test extends Get_Repos_Test {

	get description () {
		return 'should return an error when trying to fetch repos from a team i\'m not a member of';
	}

	get_expected_error () {
		return {
			code: 'RAPI-1009'
		};
	}

	set_path (callback) {
		let team_id = this.foreign_team._id;
		let ids = this.foreign_repo._id;
		this.path = `/repos?team_id=${team_id}&ids=${ids}`;
		callback();
	}
}

module.exports = ACL_Test;
