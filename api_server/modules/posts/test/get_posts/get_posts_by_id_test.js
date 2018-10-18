'use strict';

const GetPostsTest = require('./get_posts_test');

class GetPostsByIdTest extends GetPostsTest {

	get description () {
		return 'should return the correct posts when requesting posts by ID';
	}

	// set the path to use for the request
	setPath (callback) {
		// we'll restrict our fetch to a few of the posts we created
		const posts = this.postData.map(postData => postData.post);
		this.expectedPosts = [
			posts[0],
			posts[2],
			posts[3]
		];
		const ids = this.expectedPosts.map(post => post._id);
		this.path = `/posts?teamId=${this.team._id}&streamId=${this.stream._id}&ids=${ids}`;
		callback();
	}
}

module.exports = GetPostsByIdTest;
