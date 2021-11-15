'use strict';

const ComplexTest = require('./complex_test');

class GetComplexPostsSortTest extends ComplexTest {

	get description () {
		return 'should return the correct posts, when a complex arrangement of posts is available, in correct order when requesting posts in ascending order by ID';
	}

	// set the path to use for the request
	setPath (callback) {
		// sort the posts by ID, then specify an ascending sort order in the request
		this.expectedPosts = this.postData.map(postData => postData.post);
		this.expectedPosts.push(this.repoPost);
		this.expectedPosts.sort((a, b) => {
			return a.id.localeCompare(b.id);
		});
		this.path = `/posts?teamId=${this.team.id}&sort=asc`;
		callback();
	}

	// validate the request response
	validateResponse (data) {
		// this will check that the received posts not only match, but they are in the expected order
		data.posts.forEach(post => {
			const expectedPost = this.expectedPosts.find(expectedPost => expectedPost.id === post.id);
			expectedPost.version = post.version;
			expectedPost.modifiedAt = post.modifiedAt;
			expectedPost.numReplies = post.numReplies;
		});
		this.validateSortedMatchingObjects(data.posts, this.expectedPosts, 'posts');
		super.validateResponse(data);
	}
}

module.exports = GetComplexPostsSortTest;
