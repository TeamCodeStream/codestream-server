'use strict';

var GetPostsTest = require('./get_posts_test');

class GetPostsByOtherTest extends GetPostsTest {

	get description () {
		return 'should return the correct posts when requesting posts in a stream authored by another user';
	}

	setPath (callback) {
		let userId = this.otherUserData.user._id;
		this.myPosts = this.myPosts.filter(post => post.creatorId === userId);
		this.path = `/posts/?teamId=${this.team._id}&streamId=${this.stream._id}&creatorId=${userId}`;
		callback();
	}
}

module.exports = GetPostsByOtherTest;
