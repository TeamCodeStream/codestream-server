'use strict';

var Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
var GetRepoRequestTester = require('./get_repo/get_repo_request_tester');
var GetReposRequestTester = require('./get_repos/get_repos_request_tester');
var PostRepoRequestTester = require('./post_repo/post_repo_request_tester');
var FindRepoRequestTester = require('./find_repo/find_repo_request_tester');

class ReposRequestTester extends Aggregation(
	GetRepoRequestTester,
	GetReposRequestTester,
	PostRepoRequestTester,
	FindRepoRequestTester
) {
}

module.exports = ReposRequestTester;
