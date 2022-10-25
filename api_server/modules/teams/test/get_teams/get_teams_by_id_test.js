'use strict';

const GetTeamsTest = require('./get_teams_test');

class GetTeamsByIdTest extends GetTeamsTest {

	get description () {
		return 'should return the correct teams when requesting teams by ID';
	}

	setPath (callback) {
		if (this.oneUserPerOrg) {
			this.path = `/teams?ids=${this.team.id}`; // only this makes sense in ONE_USER_PER_ORG
		} else {
			this.path = `/teams?ids=${this.team.id},${this.teamWithMe.id}`;
		}
		callback();
	}
}

module.exports = GetTeamsByIdTest;
