'use strict';

var Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
var GetTeamRequestTester = require('./get_team/get_team_request_tester');
var GetTeamsRequestTester = require('./get_teams/get_teams_request_tester');

class TeamsRequestTester extends Aggregation(
	GetTeamRequestTester,
	GetTeamsRequestTester
) {
}

module.exports = TeamsRequestTester;
