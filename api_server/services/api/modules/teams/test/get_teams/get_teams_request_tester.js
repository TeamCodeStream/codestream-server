'use strict';

var GetTeamsByIdTest = require('./get_teams_by_id_test');
var IDsRequiredTest = require('./ids_required_test');
var GetMyTeamsTest = require('./get_my_teams_test');
var ACLTest = require('./acl_test');

class GetTeamsRequestTester {

	getTeamsTest () {
		new GetMyTeamsTest().test();
		new GetTeamsByIdTest().test();
		new IDsRequiredTest().test();
		new ACLTest().test();
	}
}

module.exports = GetTeamsRequestTester;
