'use strict';

var GetPostsTest = require('./get_posts_test');

class GetPostsBySeqNumTest extends GetPostsTest {

	constructor (options) {
		super(options);
		this.numPosts = 10;
	}

	get description () {
		return 'should return the correct posts when requesting posts by sequence number';
	}

	setPath (callback) {
		this.myPosts.sort((a, b) => { return a.seqNum - b.seqNum; });
		this.myPosts = this.myPosts.slice(3, 8);
		this.path = `/posts?teamId=${this.team._id}&streamId=${this.stream._id}&seqnum=4-8`;
		callback();
	}
}

module.exports = GetPostsBySeqNumTest;
