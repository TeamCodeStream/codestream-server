'use strict';

var GetPostsTest = require('./get_posts_test');

class SeqNumLimitTest extends GetPostsTest {

	constructor (options) {
		super(options);
		this.numPosts = 110;
	}

	get description () {
		return 'should return the maximum posts per page when requesting a sequence number range larger than the limit';
	}

	// set the path to use in the fetch request
	setPath (callback) {
		// the results (in myPosts) should be the first 100 posts, even if we ask for more
		this.myPosts.sort((a, b) => { return a.seqNum - b.seqNum; });
		this.myPosts.splice(100);
		this.path = `/posts/?teamId=${this.team._id}&streamId=${this.stream._id}&seqnum=1-105`;
		callback();
	}

	// validate the response
	validateResponse (data) {
		// sort and compare to the posts we expected
		data.posts.sort((a, b) => { return a.seqNum - b.seqNum; });
		super.validateResponse(data);
	}
}

module.exports = SeqNumLimitTest;
