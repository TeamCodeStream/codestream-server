'use strict';

// make jshint happy
/* globals describe */

var Posts_Request_Tester = require('./posts_request_tester');

var posts_request_tester = new Posts_Request_Tester();

describe('post requests', function() {

	this.timeout(20000);

	describe('GET /post/:id', posts_request_tester.get_post_test);
	describe('GET /posts', posts_request_tester.get_posts_test);
	describe('POST /posts', posts_request_tester.post_post_test);

});
