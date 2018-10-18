// handle unit tests for the repos module

'use strict';

// make eslint happy
/* globals describe */

const ReposRequestTester = require('./repos_request_tester');

const reposRequestTester = new ReposRequestTester();

describe('repo requests', function() {

	this.timeout(20000);

	describe('GET /repos/:id', reposRequestTester.getRepoTest);
	describe('GET /repos', reposRequestTester.getReposTest);
	describe('url normalizer', require('./normalize_url/test'));
});
