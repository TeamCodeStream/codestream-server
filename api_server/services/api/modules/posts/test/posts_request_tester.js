'use strict';

var Aggregation = require(process.env.CS_API_TOP + '/lib/util/aggregation');
var GetPostRequestTester = require('./get_post/get_post_request_tester');
var GetPostsRequestTester = require('./get_posts/get_posts_request_tester');
var PostPostRequestTester = require('./post_post/post_post_request_tester');

class PostsRequestTester extends Aggregation(
	GetPostRequestTester,
	GetPostsRequestTester,
	PostPostRequestTester
) {
}

module.exports = PostsRequestTester;
