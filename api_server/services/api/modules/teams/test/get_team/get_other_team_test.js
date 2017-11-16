'use strict';

var GetTeamTest = require('./get_team_test');

class GetOtherTeamTest extends GetTeamTest {

	get description () {
		return 'should return a valid team when requesting a team created by another user that i am on';
	}

	setPath (callback) {
		this.path = '/teams/' + this.otherTeam._id;
		callback();
	}

	validateResponse (data) {
		this.validateMatchingObject(this.otherTeam._id, data.team, 'team');
		super.validateResponse(data);
	}
}

module.exports = GetOtherTeamTest;
