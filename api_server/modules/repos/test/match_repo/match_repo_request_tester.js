// handle unit tests for the "GET /no-auth/match-repo" request

'use strict';

const MatchRepoTest = require('./match_repo_test');
const MultipleReposInTeamTest = require('./multiple_repos_in_team_test');
const MultipleTeamsMatchingRepoTest = require('./multiple_teams_matching_repo_test');
const MatchByDomainTest = require('./match_by_domain_test');
const NoMatchTest = require('./no_match_test');
const NoAttributeTest = require('./no_attribute_test');
const MalformedPathTest = require('./malformed_path_test');
const ExactMatchTest = require('./exact_match_test');
const ShaMismatchTest = require('./sha_mismatch_test');
const MultipleCommitHashTest = require('./multiple_commit_hash_test');

class MatchRepoRequestTester {

	matchRepoTest () {
		new MatchRepoTest().test();
		new MultipleReposInTeamTest().test();
		new MultipleTeamsMatchingRepoTest().test();
		new MatchByDomainTest().test();
		new NoMatchTest().test();
		new NoAttributeTest({ attribute: 'url' }).test();
		new NoAttributeTest({ attribute: 'knownCommitHashes' }).test();
		new MalformedPathTest().test();
		new ExactMatchTest().test();
		new ShaMismatchTest().test();
		new MultipleCommitHashTest().test();
	}
}

module.exports = MatchRepoRequestTester;
