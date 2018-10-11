// handle unit tests for the repos module

'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const GetRepoRequestTester = require('./get_repo/get_repo_request_tester');
const GetReposRequestTester = require('./get_repos/get_repos_request_tester');

class ReposRequestTester extends Aggregation(
	GetRepoRequestTester,
	GetReposRequestTester
) {
}

module.exports = ReposRequestTester;
