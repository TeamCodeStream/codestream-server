'use strict';

const PutTeamTest = require('./put_team_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');
const TeamTestConstants = require('../team_test_constants');

class PutTeamFetchTest extends PutTeamTest {

	get description () {
		return 'should properly update a team when requested, checked by fetching the team';
	}

	get method () {
		return 'get';
	}

	getExpectedFields () {
		return { team: TeamTestConstants.EXPECTED_TEAM_FIELDS };
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,	// do the usual test prep
			this.updateTeam	// perform the actual update
		], callback);
	}

	// validate that the response is correct
	validateResponse (data) {
		// verify what we fetch is what we got back in the response
		const expectedTeam = Object.assign({}, this.team, this.updateTeamResponse.team.$set);
		data.team.memberIds.sort();
		expectedTeam.memberIds.sort();
		expectedTeam.companyMemberCount = expectedTeam.memberIds.length - 1;
		Assert.deepEqual(data.team, expectedTeam, 'fetched team does not match');
	}
}

module.exports = PutTeamFetchTest;
