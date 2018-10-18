'use strict';

const GetUsersByTeamIdTest = require('./get_users_by_team_id_test');

class ACLTest extends GetUsersByTeamIdTest {

	constructor (options) {
		super(options);
		Object.assign(this.teamOptions, {
			creatorIndex: 1,
			members: [2]
		});
	}

	get description () {
		return 'should return an error when trying to fetch users from a team i\'m not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}
}

module.exports = ACLTest;
