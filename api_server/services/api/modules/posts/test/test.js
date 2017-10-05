'use strict';

// make jshint happy
/* globals describe */

var Post_Request_Tester = require('./post_request_tester');

var post_request_tester = new Post_Request_Tester();

describe('post requests', function() {

	this.timeout(20000);

	describe('GET /post/:id', post_request_tester.get_post_test);
	describe('GET /posts', post_request_tester.get_posts_test);
	describe('POST /post', post_request_tester.post_post_test);

});
