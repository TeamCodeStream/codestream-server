// handle unit tests for the teams module

'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const GetTeamRequestTester = require('./get_team/get_team_request_tester');
const GetTeamsRequestTester = require('./get_teams/get_teams_request_tester');
const PostTeamRequestTester = require('./post_team/post_team_request_tester');
const PutTeamRequestTester = require('./put_team/put_team_request_tester');
const PutTeamSettingsRequestTester = require('./put_team_settings/put_team_settings_request_tester');

class TeamsRequestTester extends Aggregation(
	GetTeamRequestTester,
	GetTeamsRequestTester,
	PostTeamRequestTester,
	PutTeamRequestTester,
	PutTeamSettingsRequestTester
) {
}

module.exports = TeamsRequestTester;
