'use strict';

var GetTeamsTest = require('./get_teams_test');

class GetMyTeamsTest extends GetTeamsTest {

	get description () {
		return 'should return teams i am a member of when requesting my teams';
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		this.path = '/teams?mine';
		callback();
	}

	// validate the response to the test request
	validateResponse (data) {
		// validate that we got back _only_ the teams i am on
		// (created by me, or created by the other user but including me)
		let myTeams = [this.myTeam, ...this.otherTeams];
		this.validateMatchingObjects(myTeams, data.teams, 'teams');
		super.validateResponse(data);
	}
}

module.exports = GetMyTeamsTest;
