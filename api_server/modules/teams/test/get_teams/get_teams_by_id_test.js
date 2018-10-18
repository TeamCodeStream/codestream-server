'use strict';

const GetTeamsTest = require('./get_teams_test');

class GetTeamsByIdTest extends GetTeamsTest {

	get description () {
		return 'should return the correct teams when requesting teams by ID';
	}

	setPath (callback) {
		// i'm in both of these teams, so i should be able to fetch them
		this.path = `/teams?ids=${this.team._id},${this.teamWithMe._id}`;
		callback();
	}
}

module.exports = GetTeamsByIdTest;
