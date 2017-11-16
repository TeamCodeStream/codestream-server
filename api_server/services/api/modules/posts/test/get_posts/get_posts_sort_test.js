'use strict';

var GetPostsTest = require('./get_posts_test');

class GetPostsSortTest extends GetPostsTest {

	get description () {
		return 'should return the correct posts in correct order when requesting posts in ascending order by ID';
	}

	setPath (callback) {
		this.path = `/posts/?teamId=${this.team._id}&streamId=${this.stream._id}&sort=asc`;
		callback();
	}

	validateResponse (data) {
		this.validateSortedMatchingObjects(data.posts, this.myPosts, 'posts');
		super.validateResponse(data);
	}
}

module.exports = GetPostsSortTest;
