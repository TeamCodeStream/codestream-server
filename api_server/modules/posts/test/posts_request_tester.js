// handle unit tests for the posts module

'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const GetPostRequestTester = require('./get_post/get_post_request_tester');
const GetPostsRequestTester = require('./get_posts/get_posts_request_tester');
const PostPostRequestTester = require('./post_post/post_post_request_tester');
const PutPostRequestTester = require('./put_post/put_post_request_tester');
const DeletePostRequestTester = require('./delete_post/delete_post_request_tester');
const ReactRequestTester = require('./react/react_request_tester');
const EmailNotificationTester = require('./email_notifications/email_notification_tester');

class PostsRequestTester extends Aggregation(
	GetPostRequestTester,
	GetPostsRequestTester,
	PostPostRequestTester,
	PutPostRequestTester,
	DeletePostRequestTester,
	ReactRequestTester,
	EmailNotificationTester
) {
}

module.exports = PostsRequestTester;
