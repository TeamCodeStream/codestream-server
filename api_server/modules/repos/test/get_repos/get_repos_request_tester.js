// handle unit tests for the "GET /repos" request

'use strict';

const GetReposByTeamTest = require('./get_repos_by_team_test');
const GetReposByIdTest = require('./get_repos_by_id_test');
const TeamIDRequiredTest = require('./team_id_required_test');
const GetReposOnlyFromTeamTest = require('./get_repos_only_from_team_test');
const ACLTest = require('./acl_test');

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
