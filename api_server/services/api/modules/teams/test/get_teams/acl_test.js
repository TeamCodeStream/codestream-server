'use strict';

var Get_Teams_Test = require('./get_teams_test');

class ACL_Test extends Get_Teams_Test {

	get description () {
		return 'should return an error when trying to fetch teams including one that i\'m not a member of';
	}

	get_expected_error () {
		return {
			code: 'RAPI-1009'
		};
	}

	set_path (callback) {
		let ids = [
			this.my_team._id,
			this.other_teams[0]._id,
			this.foreign_team._id
		];
		this.path = '/teams?ids=' + ids.join(',');
		callback();
	}
}

module.exports = ACL_Test;
