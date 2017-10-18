'use strict';

var Get_Teams_Test = require('./get_teams_test');

class Get_My_Teams_Test extends Get_Teams_Test {

	get description () {
		return 'should return teams i am a member of when requesting my teams';
	}

	set_path (callback) {
		this.path = '/teams?mine';
		callback();
	}

	validate_response (data) {
		let my_teams = [this.my_team, ...this.other_teams];
		this.validate_matching_objects(my_teams, data.teams, 'teams');
		super.validate_response(data);
	}
}

module.exports = Get_My_Teams_Test;
