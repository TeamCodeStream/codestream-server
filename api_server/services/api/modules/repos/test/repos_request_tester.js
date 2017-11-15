'use strict';

var Aggregation = require(process.env.CS_API_TOP + '/lib/util/aggregation');
var GetRepoRequestTester = require('./get_repo/get_repo_request_tester');
var GetReposRequestTester = require('./get_repos/get_repos_request_tester');
var PostRepoRequestTester = require('./post_repo/post_repo_request_tester');

class ReposRequestTester extends Aggregation(
	GetRepoRequestTester,
	GetReposRequestTester,
	PostRepoRequestTester
) {
}

module.exports = ReposRequestTester;
