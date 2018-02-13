// handle unit tests for the "GET /teams/:id" request

'use strict';

var GetMyTeamTest = require('./get_my_team_test');
var GetOtherTeamTest = require('./get_other_team_test');
var NotFoundTest = require('./not_found_test');
var ACLTest = require('./acl_test');

class GetTeamRequestTester {

	getTeamTest () {
		new GetMyTeamTest().test();
		new GetOtherTeamTest().test();
		new NotFoundTest().test();
		new ACLTest().test();
	}
}

module.exports = GetTeamRequestTester;
