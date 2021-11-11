'use strict';

const ComplexTest = require('./complex_test');

class GetComplexPostsBeforeTest extends ComplexTest {

	get description () {
		return 'should return the correct posts, when a complex arrangement of posts is available, when requesting posts before an ID';
	}

	// set the path to use for the request
	setPath (callback) {
		// pick a pivot point, then filter our expected posts based on that pivot,
		// and specify the before parameter to fetch based on the pivot
		this.expectedPosts = this.postData.map(postData => postData.post);
		this.expectedPosts.push(this.repoPost);
		const pivot = this.expectedPosts[19].id;
		this.expectedPosts = this.expectedPosts.filter(post => {
			return pivot.localeCompare(post.id) > 0;
		});
		this.path = `/posts?teamId=${this.team.id}&before=${pivot}`;
		callback();
	}
}

module.exports = GetComplexPostsBeforeTest;
