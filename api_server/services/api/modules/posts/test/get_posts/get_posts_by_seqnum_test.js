'use strict';

var GetPostsTest = require('./get_posts_test');

class GetPostsBySeqNumTest extends GetPostsTest {

	get description () {
		return 'should return the correct posts when requesting posts by sequence number';
	}

	setPath (callback) {
		this.myPosts = this.myPosts.slice(0, 3);
		this.path = `/posts?teamId=${this.team._id}&streamId=${this.stream._id}&lte=3&seqnum`;
		callback();
	}
}

module.exports = GetPostsBySeqNumTest;
