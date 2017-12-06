'use strict';

var GetPostsTest = require('./get_posts_test');

class GetPostsBySingleSeqNumTest extends GetPostsTest {

	get description () {
		return 'should return the correct post when requesting a single by sequence number';
	}

	setPath (callback) {
		this.myPosts.sort((a, b) => { return a.seqNum - b.seqNum; });
		this.myPosts = [this.myPosts[3]];
		this.path = `/posts?teamId=${this.team._id}&streamId=${this.stream._id}&seqnum=4`;
		callback();
	}
}

module.exports = GetPostsBySingleSeqNumTest;
