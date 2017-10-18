'use strict';

var Get_Team_Test = require('./get_team_test');

class Get_My_Team_Test extends Get_Team_Test {

	get description () {
		return 'should return a valid team when requesting a team created by me';
	}

	set_path (callback) {
		this.path = '/teams/' + this.my_team._id;
		callback();
	}

	validate_response (data) {
		this.validate_matching_object(this.my_team._id, data.team, 'team');
		super.validate_response(data);
	}
}

module.exports = Get_My_Team_Test;
