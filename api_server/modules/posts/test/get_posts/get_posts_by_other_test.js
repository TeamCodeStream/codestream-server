'use strict';

var GetPostsTest = require('./get_posts_test');

class GetPostsByOtherTest extends GetPostsTest {

	get description () {
		return 'should return the correct posts when requesting posts in a stream authored by another user';
	}

	// set the path to use for the request
	setPath (callback) {
		// we'll restrict the posts we expect to those authored by the "other" user, then fetch those by specifying creatorId
		let userId = this.otherUserData.user._id;
		this.myPosts = this.myPosts.filter(post => post.creatorId === userId);
		this.path = `/posts/?teamId=${this.team._id}&streamId=${this.stream._id}&creatorId=${userId}`;
		callback();
	}
}

module.exports = GetPostsByOtherTest;
