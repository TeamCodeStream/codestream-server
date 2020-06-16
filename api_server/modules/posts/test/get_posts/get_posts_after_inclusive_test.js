'use strict';

const GetPostsTest = require('./get_posts_test');

class GetPostsAfterInclusiveTest extends GetPostsTest {

	get description () {
		return 'should return the correct posts when requesting posts in a stream after a seqnum, inclusive';
	}

	// set the path to use for the request
	setPath (callback) {
		// pick a pivot point, then filter our expected posts based on that pivot,
		// and specify the before parameter to fetch based on the pivot
		this.expectedPosts = this.postData.map(postData => postData.post);
		const pivot = this.expectedPosts[2].seqNum;
		this.expectedPosts = this.expectedPosts.filter(post => post.seqNum >= pivot);
		this.path = `/posts?teamId=${this.team.id}&streamId=${this.stream.id}&after=${pivot}&inclusive`;
		callback();
	}
}

module.exports = GetPostsAfterInclusiveTest;
