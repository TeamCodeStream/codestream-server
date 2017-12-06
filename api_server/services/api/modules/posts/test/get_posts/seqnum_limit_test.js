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

	setPath (callback) {
		this.myPosts.sort((a, b) => { return a.seqNum - b.seqNum; });
		this.myPosts.splice(100);
		this.path = `/posts/?teamId=${this.team._id}&streamId=${this.stream._id}&seqnum=1-105`;
		callback();
	}

	validateResponse (data) {
		data.posts.sort((a, b) => { return a.seqNum - b.seqNum; });
		super.validateResponse(data);
	}
}

module.exports = SeqNumLimitTest;
