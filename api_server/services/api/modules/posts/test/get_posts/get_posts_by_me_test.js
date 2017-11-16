'use strict';

var GetPostsTest = require('./get_posts_test');

class GetPostsByMeTest extends GetPostsTest {

	get description () {
		return 'should return the correct posts when requesting posts in a stream authored by me';
	}

	setPath (callback) {
		this.myPosts = this.myPosts.filter(post => post.creatorId === this.currentUser._id);
		this.path = `/posts/?teamId=${this.team._id}&streamId=${this.stream._id}&mine`;
		callback();
	}
}

module.exports = GetPostsByMeTest;
