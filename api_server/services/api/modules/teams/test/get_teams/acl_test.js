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

	setPath (callback) {
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
