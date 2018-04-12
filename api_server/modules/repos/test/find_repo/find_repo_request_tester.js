// handle unit tests for the "GET /no-auth/find-repo" request

'use strict';

var FindRepoTest = require('./find_repo_test');
var NoAttributeTest = require('./no_attribute_test');
var NormalizeTest = require('./normalize_test');
var NoRepoTest = require('./no_repo_test');
var ShaMismatchTest = require('./sha_mismatch_test');
var MultipleCommitHashTest = require('./multiple_commit_hash_test');

class FindRepoRequestTester {

	findRepoTest () {
		new FindRepoTest().test();
		new NoAttributeTest({ attribute: 'url' }).test();
		new NoAttributeTest({ attribute: 'knownCommitHashes' }).test();
		new NormalizeTest().test();
		new NoRepoTest().test();
		new ShaMismatchTest().test();
		new MultipleCommitHashTest().test();
	}
}

module.exports = FindRepoRequestTester;
