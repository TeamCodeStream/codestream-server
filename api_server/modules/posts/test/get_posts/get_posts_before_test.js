'use strict';

const GetPostsTest = require('./get_posts_test');

class GetPostsBeforeTest extends GetPostsTest {

	get description () {
		return 'should return the correct posts when requesting posts before an ID';
	}

	// set the path to use for the request
	setPath (callback) {
		// pick a pivot point, then filter our expected posts based on that pivot,
		// and specify the before parameter to fetch based on the pivot
		this.expectedPosts = this.postData.map(postData => postData.post);
		const pivot = this.expectedPosts[2].id;
		this.expectedPosts = this.expectedPosts.filter(post => post.id < pivot);
		this.path = `/posts?teamId=${this.team.id}&before=${pivot}`; // &streamId=${this.teamStream.id}
		callback();
	}
}

module.exports = GetPostsBeforeTest;
