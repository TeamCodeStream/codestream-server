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
			this.team._id,
			this.teamWithMe._id,
			this.teamWithoutMe._id
		];
		this.path = '/teams?ids=' + ids.join(',');
		callback();
	}
}

module.exports = ACLTest;
