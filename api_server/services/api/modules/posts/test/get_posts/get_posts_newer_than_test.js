'use strict';

var GetPostsTest = require('./get_posts_test');

class GetPostsNewerThanTest extends GetPostsTest {

	get description () {
		return 'should return the correct posts when requesting posts in a stream edited more recently than some timestamp';
	}

	setPath (callback) {
		let pivot = this.myPosts[2].modifiedAt;
		this.myPosts = this.myPosts.filter(post => post.modifiedAt > pivot);
		this.path = `/posts/?teamId=${this.team._id}&streamId=${this.stream._id}&newerThan=${pivot}`;
		callback();
	}
}

module.exports = GetPostsNewerThanTest;
