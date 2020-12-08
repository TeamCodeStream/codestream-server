'use strict';

const TeamLookupTest = require('./team_lookup_test');

class TeamMustHaveAutoJoinTest extends TeamLookupTest {

	get description() {
		return `should return an error when trying to lookup a team by repo and the team does not have auto-join enabled`;
	}

	getExpectedError() {
		return {
			code: 'RAPI-1009',
			reason: 'Auto-join is not enabled for this team'
		};
	}

	// override the default call to set team settings, override by doing nothing
	setTeamSettings (callback) {
		callback();
	}
}

module.exports = TeamMustHaveAutoJoinTest;
