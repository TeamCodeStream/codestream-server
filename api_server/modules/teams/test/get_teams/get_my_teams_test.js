'use strict';

var GetTeamsTest = require('./get_teams_test');

class GetMyTeamsTest extends GetTeamsTest {

	get description () {
		return 'should return teams i am a member of when requesting my teams';
	}

	setPath (callback) {
		this.path = '/teams?mine';
		callback();
	}

	validateResponse (data) {
		let myTeams = [this.myTeam, ...this.otherTeams];
		this.validateMatchingObjects(myTeams, data.teams, 'teams');
		super.validateResponse(data);
	}
}

module.exports = GetMyTeamsTest;
