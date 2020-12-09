// base class for many tests of the "GET /no-auth/teams/:teamId/auth-settings" requests

'use strict';

const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class GetAuthSettingsTest extends CodeStreamAPITest {

	get description() {
		return 'should return a team\'s auth settings, when requested';
	}

	get method() {
		return 'get';
	}

	// before the test runs...
	before(callback) {
		this.teamOptions.creatorIndex = 1;
		if (this.userNotOnTeam) {
			this.teamOptions.members = [];
		}
		BoundAsync.series(this, [
			super.before,
			this.setTeamSettings
		], callback);
	}

	// set the team's authentication settings
	setTeamSettings(callback) {
		this.path = `/no-auth/teams/${this.team.id}/auth-settings`;
		const data = this.getSettingsData();
		this.doApiRequest(
			{
				method: 'put',
				path: `/team-settings/${this.team.id}`,
				token: this.users[1].accessToken,
				data
			},
			callback
		);
	}

	// get the data to be used for the test request
	getSettingsData() {
		this.expectedData = {
			limitAuthentication: true,
			authenticationProviders: [
				'trello*com',
				'github*com'
			]
		};
		return Object.assign({}, this.expectedData, {
			otherSettings: {
				one: 1,
				two: 2
			}
		});
	}

	// validate the response to the test request
	validateResponse(data) {
		Assert.deepStrictEqual(data, this.expectedData, 'response not correct');
	}
}

module.exports = GetAuthSettingsTest;
