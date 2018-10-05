'use strict';

const GetPostsTest = require('./get_posts_test');

class GetPostsBeforeInclusiveTest extends GetPostsTest {

	get description () {
		return 'should return the correct posts when requesting posts in a stream before a seqnum, inclusive';
	}

	// set the path to use for the request
	setPath (callback) {
		// pick a pivot point, then filter our expected posts based on that pivot,
		// and specify the before parameter to fetch based on the pivot
		const pivot = this.myPosts[2].seqNum;
		this.myPosts = this.myPosts.filter(post => post.seqNum <= pivot);
		this.path = `/posts/?teamId=${this.team._id}&streamId=${this.stream._id}&before=${pivot}&inclusive`;
		callback();
	}
}

module.exports = GetPostsBeforeInclusiveTest;
