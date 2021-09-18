// handle unit tests for the "GET /repos/match/:teamId" request,
// to match repo remotes and commit hashes to known repos, without making changes to stored data

'use strict';

const MatchRepoTest = require('./match_repo_test');
const MatchRepoByCommitHashTest = require('./match_repo_by_commit_hash_test');
const MatchRepoByDecoratedRemoteTest = require('./match_repo_by_decorated_remote_test');
const AddRemoteTest = require('./add_remote_test');
const AddCommitHashTest = require('./add_commit_hash_test');
const CreateRepoTest = require('./create_repo_test');
const ACLTest = require('./acl_test');
const ReposRequiredTest = require('./repos_required_test');
const MustBeArrayTest = require('./must_be_array_test');
const NoRemotesTest = require('./no_remotes_test');
const InvalidParameterTest = require('./invalid_parameter_test');

class MatchReposRequestTester {

	test () {
		new MatchRepoTest().test();
		new MatchRepoByCommitHashTest().test();
		new MatchRepoByDecoratedRemoteTest().test();
		new AddRemoteTest().test();
		new AddCommitHashTest().test();
		new CreateRepoTest().test();
		new ACLTest().test();
		new ReposRequiredTest().test();
		new MustBeArrayTest({ parameter: 'remotes' }).test();
		new MustBeArrayTest({ parameter: 'knownCommitHashes' }).test();
		new NoRemotesTest().test();
		new InvalidParameterTest().test();
	}
}

module.exports = new MatchReposRequestTester();
