// handle unit tests for the "GET /teams/:id" request

'use strict';

const GetTeamTest = require('./get_team_test');
const GetOtherTeamTest = require('./get_other_team_test');
const NotFoundTest = require('./not_found_test');
const ACLTest = require('./acl_test');

class GetTeamRequestTester {

	getTeamTest () {
		new GetTeamTest().test();
		new GetOtherTeamTest().test();
		new NotFoundTest().test();
		new ACLTest().test();
	}
}

module.exports = GetTeamRequestTester;
