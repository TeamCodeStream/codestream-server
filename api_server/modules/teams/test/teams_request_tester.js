// handle unit tests for the teams module

'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const GetTeamRequestTester = require('./get_team/get_team_request_tester');
const GetTeamsRequestTester = require('./get_teams/get_teams_request_tester');
const PostTeamRequestTester = require('./post_team/post_team_request_tester');

class TeamsRequestTester extends Aggregation(
	GetTeamRequestTester,
	GetTeamsRequestTester,
	PostTeamRequestTester
) {
}

module.exports = TeamsRequestTester;
