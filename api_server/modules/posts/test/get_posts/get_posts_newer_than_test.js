'use strict';

var GetPostsTest = require('./get_posts_test');

class GetPostsNewerThanTest extends GetPostsTest {

	get description () {
		return 'should return the correct posts when requesting posts in a stream edited more recently than some timestamp';
	}

	// set the path to use for the request
	setPath (callback) {
		// pick a pivot point based on modifiedAt (the modification time of the post),
		// then filter our expected posts based on that pivot,
		// and specify the newer_than parameter to fetch based on the pivot
		this.expectedPosts = this.postData.map(postData => postData.post);
		let pivot = this.myPosts[2].modifiedAt;
		this.myPosts = this.myPosts.filter(post => post.modifiedAt > pivot);
		this.path = `/posts/?teamId=${this.team._id}&streamId=${this.stream._id}&newerThan=${pivot}`;
		callback();
	}
}

module.exports = GetPostsNewerThanTest;
