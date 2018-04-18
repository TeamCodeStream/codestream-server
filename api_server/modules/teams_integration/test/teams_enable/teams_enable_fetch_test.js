'use strict';

const TeamsEnableTest = require('./teams_enable_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Assert = require('assert');

class TeamsEnableFetchTest extends TeamsEnableTest {

	get description () {
		return 'should enable MS Teams integration when requested, verified by fetching the team info';
	}

	get method () {
		return 'get';
	}

	// before the test runs..
	before (callback) {
		BoundAsync.series(this, [
			super.before,		// create team and repo
			this.enableTeams	// enable teams integration, we'll verify by fetching the team
		], callback);
	}

	// enable teams integration for the team we created
	// the actual test will be verifying that the teams integration is enabled by fetching the team
	enableTeams (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/no-auth/teams-enable',
				data: this.data
			},
			error => {
				if (error) { return callback(error); }
				this.path = '/teams/' + this.team._id;
				this.previousData = this.data;
				this.data = null;
				this.token = this.currentUserData.accessToken;
				callback();
			}
		);
	}

	// validate the response to the test request
	validateResponse (data) {
		// validate the data returned when we expect a team
		const team = data.team;
		const wantEnabled = this.wantDisabled ? false : true;
		Assert(team._id === this.team._id, 'team ID does not match');
		Assert(team.integrations.teams.enabled === wantEnabled , `teams integration not ${wantEnabled ? 'enabled' : 'disabled'}`);
		Assert.deepEqual(team.integrations.teams.info, this.integrationInfo, 'info does not match');
	}
}

module.exports = TeamsEnableFetchTest;
