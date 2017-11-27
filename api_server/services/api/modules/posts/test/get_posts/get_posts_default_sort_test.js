'use strict';

var GetPostsTest = require('./get_posts_test');

class GetPostsDefaultSortTest extends GetPostsTest {

	get description () {
		return 'should return the correct posts in descending order when requesting posts in default sort order';
	}

	setPath (callback) {
		this.myPosts.sort((a, b) => {
			return a._id.localeCompare(b._id);
		});
		this.myPosts.reverse();
		this.path = `/posts/?teamId=${this.team._id}&streamId=${this.stream._id}`;
		callback();
	}

	validateResponse (data) {
		this.validateSortedMatchingObjects(data.posts, this.myPosts, 'posts');
		super.validateResponse(data);
	}
}

module.exports = GetPostsDefaultSortTest;
