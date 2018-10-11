// handle unit tests for the "GET /teams" request

'use strict';

const GetTeamsTest = require('./get_teams_test');
const GetTeamsByIdTest = require('./get_teams_by_id_test');
const IDsRequiredTest = require('./ids_required_test');
const ACLTest = require('./acl_test');

class GetTeamsRequestTester {

	getTeamsTest () {
		new GetTeamsTest().test();
		new GetTeamsByIdTest().test();
		new IDsRequiredTest().test();
		new ACLTest().test();
	}
}

module.exports = GetTeamsRequestTester;
