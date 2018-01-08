'use strict';

var GetPostsTest = require('./get_posts_test');

class GetPostsBySingleSeqNumTest extends GetPostsTest {

	get description () {
		return 'should return the correct post when requesting a single by sequence number';
	}

	// set the path to use for the request
	setPath (callback) {
		// sort by sequence number so we're consistent, then take a single post,
		// and fetch that one as specified by the seqnum parameter
		this.myPosts.sort((a, b) => { return a.seqNum - b.seqNum; });
		this.myPosts = [this.myPosts[3]];
		this.path = `/posts?teamId=${this.team._id}&streamId=${this.stream._id}&seqnum=4`;
		callback();
	}
}

module.exports = GetPostsBySingleSeqNumTest;
