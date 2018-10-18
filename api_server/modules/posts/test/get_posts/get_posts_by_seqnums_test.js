'use strict';

const GetPostsTest = require('./get_posts_test');

class GetPostsBySeqNumsTest extends GetPostsTest {

	constructor (options) {
		super(options);
		this.postOptions.numPosts = 10;
	}

	get description () {
		return 'should return the correct posts when requesting multiple posts by inidividual sequence number';
	}

	// set the path to use for the request
	setPath (callback) {
		// sort by sequence number so we're consistent, then take a slice of our posts,
		// and fetch those as specified by the seqnum parameter
		this.expectedPosts = this.postData.map(postData => postData.post);
		this.expectedPosts.sort((a, b) => { return a.seqNum - b.seqNum; });
		this.expectedPosts = [
			this.expectedPosts[2],
			this.expectedPosts[7],
			this.expectedPosts[1],
			this.expectedPosts[8]
		];
		const seqNums = this.expectedPosts.map(post => post.seqNum).join(',');
		this.expectedPosts.sort((a, b) => { return a.seqNum - b.seqNum; });
		this.path = `/posts?teamId=${this.team._id}&streamId=${this.stream._id}&seqnum=${seqNums}`;
		callback();
	}
}

module.exports = GetPostsBySeqNumsTest;
