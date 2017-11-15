'use strict';

var GetTeamsTest = require('./get_teams_test');

class GetTeamsByIdTest extends GetTeamsTest {

	get description () {
		return 'should return the correct teams when requesting teams by ID';
	}

	setPath (callback) {
		this.path = `/teams?ids=${this.myTeam._id},${this.otherTeams[0]._id}`;
		callback();
	}

	validateResponse (data) {
		let myTeams = [this.myTeam, this.otherTeams[0]];
		this.validateMatchingObjects(myTeams, data.teams, 'teams');
		super.validateResponse(data);
	}
}

module.exports = GetTeamsByIdTest;
