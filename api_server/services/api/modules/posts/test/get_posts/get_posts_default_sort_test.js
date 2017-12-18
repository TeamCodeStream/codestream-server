'use strict';

var GetPostsTest = require('./get_posts_test');

class GetPostsDefaultSortTest extends GetPostsTest {

	get description () {
		return 'should return the correct posts in descending order when requesting posts in default sort order';
	}

	// set the path to use for the request
	setPath (callback) {
		// sort the posts we expect by ID, so we're consistent with the response
		// when we fetch, they should be in the same order
		this.myPosts.sort((a, b) => {
			return a._id.localeCompare(b._id);
		});
		this.myPosts.reverse();
		this.path = `/posts/?teamId=${this.team._id}&streamId=${this.stream._id}`;
		callback();
	}

	// validate the request response
	validateResponse (data) {
		// this will check that the received posts not only match, but they are in the expected order
		this.validateSortedMatchingObjects(data.posts, this.myPosts, 'posts');
		super.validateResponse(data);
	}
}

module.exports = GetPostsDefaultSortTest;
