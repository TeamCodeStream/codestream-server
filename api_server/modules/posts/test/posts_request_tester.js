// handle unit tests for the "POST /posts" request

'use strict';

var Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
var GetPostRequestTester = require('./get_post/get_post_request_tester');
var GetPostsRequestTester = require('./get_posts/get_posts_request_tester');
var PostPostRequestTester = require('./post_post/post_post_request_tester');
var PutPostRequestTester = require('./put_post/put_post_request_tester');
var EmailNotificationTester = require('./email_notifications/email_notification_tester');

class PostsRequestTester extends Aggregation(
	GetPostRequestTester,
	GetPostsRequestTester,
	PostPostRequestTester,
	PutPostRequestTester,
	EmailNotificationTester
) {
}

module.exports = PostsRequestTester;
