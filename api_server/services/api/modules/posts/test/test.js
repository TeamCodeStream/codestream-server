'use strict';

// make jshint happy
/* globals describe */

var PostsRequestTester = require('./posts_request_tester');

var postsRequestTester = new PostsRequestTester();

describe('post requests', function() {

	this.timeout(20000);

	describe('GET /post/:id', postsRequestTester.getPostTest);
	describe('GET /posts', postsRequestTester.getPostsTest);
	describe('POST /posts', postsRequestTester.postPostTest);

});
