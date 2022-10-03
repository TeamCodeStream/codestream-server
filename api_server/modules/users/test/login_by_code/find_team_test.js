'use strict';

const TeamIdTest = require('./team_id_test');

class FindTeamTest extends TeamIdTest {

	get description () {
		return `under one-user-per-org, even if a team ID is not given when logging in via login code, user should be able to login to the correct team by matching the code`;
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data.teamId;
			callback();
		});
	}
}

module.exports = FindTeamTest;
