// handle unit tests for the "PUT /bump-posts" request, to bump the total post count for a user

'use strict';

const BumpPostsTest = require('./bump_posts_test');
const BumpPostsFetchTest = require('./bump_posts_fetch_test');
const BumpPostsMessageTest = require('./bump_posts_message_test');

class BumpPostsRequestTester {

	test () {
		new BumpPostsTest().test();
		new BumpPostsFetchTest().test();
		new BumpPostsMessageTest().test();
	}
}

module.exports = new BumpPostsRequestTester();
