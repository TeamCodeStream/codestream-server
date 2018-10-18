'use strict';

const GetPostsTest = require('./get_posts_test');

class GetPostsBySeqNumTest extends GetPostsTest {

	constructor (options) {
		super(options);
		this.postOptions.numPosts = 10;
	}

	get description () {
		return 'should return the correct posts when requesting posts by sequence number';
	}

	// set the path to use for the request
	setPath (callback) {
		// sort by sequence number so we're consistent, then take a slice of our posts,
		// and fetch those as specified by the seqnum parameter
		this.expectedPosts = this.postData.map(postData => postData.post);
		this.expectedPosts.sort((a, b) => { return a.seqNum - b.seqNum; });
		this.expectedPosts = this.expectedPosts.slice(3, 8);
		this.path = `/posts?teamId=${this.team._id}&streamId=${this.stream._id}&seqnum=4-8`;
		callback();
	}
}

module.exports = GetPostsBySeqNumTest;
