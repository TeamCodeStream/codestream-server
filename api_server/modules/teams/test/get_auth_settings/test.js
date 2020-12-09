// handle unit tests for the "GET /no-auth/teams/:teamId/auth-settings" request to fetch auth settings for a team

'use strict';

const GetAuthSettingsTest = require('./get_auth_settings_test');
const TeamNotFoundTest = require('./team_not_found_test');
const UserNotOnTeamOkTest = require('./user_not_on_team_ok_test');
const NoTokenOkTest = require('./no_token_ok_test');

class GetAuthSettingsRequestTester {

	test() {
		new GetAuthSettingsTest().test();
		new TeamNotFoundTest().test();
		new UserNotOnTeamOkTest().test();
		new NoTokenOkTest().test();
	}
}

module.exports = new GetAuthSettingsRequestTester();
