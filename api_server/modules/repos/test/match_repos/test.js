// handle unit tests for the "PUT /repos/match/:teamId" request,
// to match repo remotes and commit hashes to known repos

'use strict';

const MatchRepoTest = require('./match_repo_test');
const MatchRepoByCommitHashTest = require('./match_repo_by_commit_hash_test');
const MatchRepoByDecoratedRemoteTest = require('./match_repo_by_decorated_remote_test');
const AddRemoteTest = require('./add_remote_test');
const AddCommitHashTest = require('./add_commit_hash_test');
const CreateRepoTest = require('./create_repo_test');
const MultipleReposTest = require('./multiple_repos_test');
const UpdateRepoMessageTest = require('./update_repo_message_test');
const UpdateRepoWithCommitHashMessageTest = require('./update_repo_with_commit_hash_message_test');
const CreateRepoMessageTest = require('./create_repo_message_test');
const ACLTest = require('./acl_test');
const ReposRequiredTest = require('./repos_required_test');
const MustByArrayTest = require('./must_by_array_test');

class MatchReposRequestTester {

	test () {
		new MatchRepoTest().test();
		new MatchRepoByCommitHashTest().test();
		new MatchRepoByDecoratedRemoteTest().test();
		new AddRemoteTest().test();
		new AddCommitHashTest().test();
		new CreateRepoTest().test();
		new MultipleReposTest().test();
		new UpdateRepoMessageTest().test();
		new UpdateRepoWithCommitHashMessageTest().test();
		new CreateRepoMessageTest().test();
		new ACLTest().test();
		new ReposRequiredTest().test();
		new MustByArrayTest({ parameter: 'remotes' }).test();
		new MustByArrayTest({ parameter: 'knownCommitHashes' }).test();
	}
}

module.exports = new MatchReposRequestTester();
