'use strict';

var GetTeamTest = require('./get_team_test');

class GetMyTeamTest extends GetTeamTest {

	get description () {
		return 'should return a valid team when requesting a team created by me';
	}

	setPath (callback) {
		this.path = '/teams/' + this.myTeam._id;
		callback();
	}

	validateResponse (data) {
		this.validateMatchingObject(this.myTeam._id, data.team, 'team');
		super.validateResponse(data);
	}
}

module.exports = GetMyTeamTest;
