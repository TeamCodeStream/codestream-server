'use strict';

var GetTeamsTest = require('./get_teams_test');

class ACLTest extends GetTeamsTest {

	get description () {
		return 'should return an error when trying to fetch teams including one that i\'m not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		// try to fetch some teams, including the "foregin" one which i am not a member of, this should trigger an error
		let ids = [
			this.myTeam._id,
			this.otherTeams[0]._id,
			this.foreignTeam._id
		];
		this.path = '/teams?ids=' + ids.join(',');
		callback();
	}
}

module.exports = ACLTest;
