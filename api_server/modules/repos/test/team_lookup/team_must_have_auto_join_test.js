'use strict';

const TeamLookupTest = require('./team_lookup_test');

class TeamMustHaveAutoJoinTest extends TeamLookupTest {

	get description() {
		return 'should return an empty array when trying to lookup a team by repo and the team does not have auto-join enabled';
	}

	// override the default call to set team settings, override by doing nothing
	setTeamSettings (callback) {
		this.expectEmpty = true;
		callback();
	}
}

module.exports = TeamMustHaveAutoJoinTest;
