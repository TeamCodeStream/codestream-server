'use strict';

var GetTeamTest = require('./get_team_test');

class GetOtherTeamTest extends GetTeamTest {

	get description () {
		return 'should return a valid team when requesting a team created by another user that i am on';
	}

	// set the path to use when making the test request
	setPath (callback) {
		// fetch the team created by the other user
		this.path = '/teams/' + this.otherTeam._id;
		callback();
	}

	// validate the response to the test request
	validateResponse (data) {
		// validate that we got back the expected team (the team created by the other user)
		this.validateMatchingObject(this.otherTeam._id, data.team, 'team');
		super.validateResponse(data);
	}
}

module.exports = GetOtherTeamTest;
