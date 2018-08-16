// handle unit tests for the posts module

'use strict';

// make eslint happy
/* globals describe */

var PostsRequestTester = require('./posts_request_tester');

var postsRequestTester = new PostsRequestTester();

describe('post requests', function() {

	this.timeout(300000);

	describe('GET /posts/:id', postsRequestTester.getPostTest);
	describe('GET /posts', postsRequestTester.getPostsTest);
	describe('POST /posts', postsRequestTester.postPostTest);
	describe('PUT /posts/:id', postsRequestTester.putPostTest);
	describe('DELETE /posts/:id', postsRequestTester.deletePostTest);
	describe('email notifications', postsRequestTester.emailNotificationTest);
});
