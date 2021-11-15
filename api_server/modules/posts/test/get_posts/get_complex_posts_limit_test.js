'use strict';

const ComplexTest = require('./complex_test');

class GetComplexPostsLimitTest extends ComplexTest {

	get description () {
		return 'should return the correct posts, when a complex arrangement of posts is available, when requesting a limited number of posts';
	}

	// set the path to use for the request
	setPath (callback) {
		// sort by ID so we're consistent with expectations, take a slice of the posts equal to the
		// size we're going to limit to, then use the limit parameter to fetch
		this.expectedPosts = this.postData.map(postData => postData.post);
		this.expectedPosts.sort((a, b) => {
			return a.id.localeCompare(b.id);
		});
		this.expectedPosts.splice(0, this.postOptions.numPosts - 12);
		this.path = `/posts?teamId=${this.team.id}&limit=12`;
		callback();
	}
}

module.exports = GetComplexPostsLimitTest;
