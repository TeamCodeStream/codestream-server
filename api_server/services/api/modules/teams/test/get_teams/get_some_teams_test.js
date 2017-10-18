'use strict';

var Get_Teams_Test = require('./get_teams_test');

class Get_Some_Teams_Test extends Get_Teams_Test {

	get description () {
		return 'should return the correct teams when requesting teams by ID';
	}

	set_path (callback) {
		this.path = `/teams?ids=${this.my_team._id},${this.other_teams[0]._id}`;
		callback();
	}

	validate_response (data) {
		let my_teams = [this.my_team, this.other_teams[0]];
		this.validate_matching_objects(my_teams, data.teams, 'teams');
		super.validate_response(data);
	}
}

module.exports = Get_Some_Teams_Test;
