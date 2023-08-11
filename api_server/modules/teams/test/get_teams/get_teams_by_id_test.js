'use strict';

const GetTeamsTest = require('./get_teams_test');

class GetTeamsByIdTest extends GetTeamsTest {

	get description () {
		return 'should return the correct teams when requesting teams by ID';
	}

	setPath (callback) {
		this.path = `/teams?ids=${this.team.id}`; // only this makes sense in one-user-per-org
		callback();
	}
}

module.exports = GetTeamsByIdTest;
