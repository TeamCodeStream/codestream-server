'use strict';

const SlackEnableTest = require('./slack_enable_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Assert = require('assert');

class SlackEnableFetchTest extends SlackEnableTest {

	get description () {
		return 'should enable slack integration when requested, verified by fetching the team info';
	}

	get method () {
		return 'get';
	}

	// before the test runs..
	before (callback) {
		BoundAsync.series(this, [
			super.before,		// create team and repo
			this.enableSlack	// enable slack integration, we'll verify by fetching the team
		], callback);
	}

	// enable slack integration for the team we created
	// the actual test will be verifying that the slack integration is enabled by fetching the team
	enableSlack (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/no-auth/slack-enable',
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
		Assert(team.integrations.slack.enabled === wantEnabled , `slack integration not ${wantEnabled ? 'enabled' : 'disabled'}`);
		Assert.deepEqual(team.integrations.slack.info, this.integrationInfo, 'info does not match');
	}
}

module.exports = SlackEnableFetchTest;
