'use strict';

var GetTeamTest = require('./get_team_test');

class GetMyTeamTest extends GetTeamTest {

	get description () {
		return 'should return a valid team when requesting a team created by me';
	}

	// set the path to use when making the test request
	setPath (callback) {
		// fetch the team i created
		this.path = '/teams/' + this.myTeam._id;
		callback();
	}

	// validate the response to the test request
	validateResponse (data) {
		// validate that we got back the expected team (the team we created)
		this.validateMatchingObject(this.myTeam._id, data.team, 'team');
		super.validateResponse(data);
	}
}

module.exports = GetMyTeamTest;
