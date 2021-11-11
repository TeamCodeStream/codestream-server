'use strict';

const ComplexTest = require('./complex_test');

class GetComplexPostsAfterTest extends ComplexTest {

	get description () {
		return 'should return the correct posts, when a complex arrangement of posts is available, when requesting posts after an ID';
	}

	// set the path to use for the request
	setPath (callback) {
		// pick a pivot point, then filter our expected posts based on that pivot,
		// and specify the before parameter to fetch based on the pivot
		this.expectedPosts = this.postData.map(postData => postData.post);
		const pivot = this.expectedPosts[28].id;
		this.expectedPosts = this.expectedPosts.filter(post => {
			return pivot.localeCompare(post.id) < 0;
		});
		this.path = `/posts?teamId=${this.team.id}&after=${pivot}`;
		callback();
	}
}

module.exports = GetComplexPostsAfterTest;
