// handle unit tests for the "GET /repos" request

'use strict';

var GetReposByTeamTest = require('./get_repos_by_team_test');
var GetReposByIdTest = require('./get_repos_by_id_test');
var TeamIDRequiredTest = require('./team_id_required_test');
var GetReposOnlyFromTeamTest = require('./get_repos_only_from_team_test');
var ACLTest = require('./acl_test');

class GetReposRequestTester {

	getReposTest () {
		new GetReposByTeamTest().test();
		new GetReposByIdTest().test();
		new TeamIDRequiredTest().test();
		new GetReposOnlyFromTeamTest().test();
		new ACLTest().test();
	}
}

module.exports = GetReposRequestTester;
