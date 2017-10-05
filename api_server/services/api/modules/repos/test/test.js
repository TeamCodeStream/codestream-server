'use strict';

// make jshint happy
/* globals describe */

var Repos_Request_Tester = require('./repos_request_tester');

var repos_request_tester = new Repos_Request_Tester();

describe('repo requests', function() {

	this.timeout(10000);

/*
	describe('GET /repos/:id', repos_request_tester.get_repo_test);
	describe('GET /repos', repos_request_tester.get_repos_test);
*/
	describe('POST /repos', repos_request_tester.post_repo_test);

});
