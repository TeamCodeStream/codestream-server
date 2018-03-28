// handle unit tests for the "GET /no-auth/match-repo" request

'use strict';

const MatchRepoTest = require('./match_repo_test');
const MultipleReposInTeamTest = require('./multiple_repos_in_team_test');
const MultipleTeamsMatchingRepoTest = require('./multiple_teams_matching_repo_test');
const MatchByDomainTest = require('./match_by_domain_test');
const NoMatchTest = require('./no_match_test');
const NoUrlTest = require('./no_url_test');
const MalformedPathTest = require('./malformed_path_test');

class MatchRepoRequestTester {

	matchRepoTest () {
		new MatchRepoTest().test();
		new MultipleReposInTeamTest().test();
		new MultipleTeamsMatchingRepoTest().test();
		new MatchByDomainTest().test();
		new NoMatchTest().test();
		new NoUrlTest().test();
		new MalformedPathTest().test();
	}
}

module.exports = MatchRepoRequestTester;
