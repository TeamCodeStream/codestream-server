'use strict';

const GetPostsTest = require('./get_posts_test');
const Assert = require('assert');

class NeedIncludeFollowedTest extends GetPostsTest {

	constructor (options) {
		super(options);
		this.postOptions.wantCodeError = true;
		this.postOptions.creatorIndex = 0;
	}

	get description () {
		return 'should return no posts when requesting posts and there are no posts in the team stream and includeFollowed is not sent, even though there are posts for code errors';
	}

	// validate the response to the fetch request
	validateResponse (data) {
		Assert(data.posts.length === 0, 'unexpected posts were returned');
		this.expectedPosts = [];
		super.validateResponse(data);
	}
}

module.exports = NeedIncludeFollowedTest;
