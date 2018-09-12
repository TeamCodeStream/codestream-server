'use strict';

var GetPostsTest = require('./get_posts_test');

class GetPostsBySeqNumsTest extends GetPostsTest {

	constructor (options) {
		super(options);
		this.numPosts = 10;
	}

	get description () {
		return 'should return the correct posts when requesting multiple posts by inidividual sequence number';
	}

	// set the path to use for the request
	setPath (callback) {
		// sort by sequence number so we're consistent, then take a slice of our posts,
		// and fetch those as specified by the seqnum parameter
		this.myPosts.sort((a, b) => { return a.seqNum - b.seqNum; });
		this.myPosts = [this.myPosts[2], this.myPosts[7], this.myPosts[1], this.myPosts[8]];
		const seqNums = this.myPosts.map(post => post.seqNum).join(',');
		this.myPosts.sort((a, b) => { return a.seqNum - b.seqNum; });
		this.path = `/posts?teamId=${this.team._id}&streamId=${this.stream._id}&seqnum=${seqNums}`;
		callback();
	}
}

module.exports = GetPostsBySeqNumsTest;
