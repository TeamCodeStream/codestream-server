'use strict';

var Aggregation = require(process.env.CI_API_TOP + '/lib/util/aggregation');
var Get_Team_Request_Tester = require('./get_team/get_team_request_tester');
var Get_Teams_Request_Tester = require('./get_teams/get_teams_request_tester');
var Post_Team_Request_Tester = require('./post_team/post_team_request_tester');

class Teams_Request_Tester extends Aggregation(
	Get_Team_Request_Tester,
	Get_Teams_Request_Tester,
	Post_Team_Request_Tester
) {
}

module.exports = Teams_Request_Tester;
