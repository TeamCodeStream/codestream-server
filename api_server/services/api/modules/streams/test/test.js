'use strict';

// make jshint happy
/* globals describe */

var Streams_Request_Tester = require('./streams_request_tester');

var streams_request_tester = new Streams_Request_Tester();

describe('stream requests', function() {

	this.timeout(10000);

/*
	describe('GET /repos/:id', repos_request_tester.get_repo_test);
	describe('GET /repos', repos_request_tester.get_repos_test);
*/
	describe('POST /streams', streams_request_tester.post_stream_test);

});
