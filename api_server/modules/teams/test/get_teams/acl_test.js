'use strict';

const GetTeamsTest = require('./get_teams_test');

class ACLTest extends GetTeamsTest {

	get description () {
		return 'should return an error when trying to fetch teams including one that i\'m not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'	 // readAuth
		};
	}

	setPath (callback) {
		// include the "foreign" team in the IDs, this should fail
		let ids = [
			this.team.id,
			this.teamWithMe.id,
			this.teamWithoutMe.id
		];
		this.path = '/teams?ids=' + ids.join(',');
		callback();
	}
}

module.exports = ACLTest;
