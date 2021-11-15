'use strict';

const ComplexTest = require('./complex_test');

class GetComplexPostsDefaultSortTest extends ComplexTest {

	get description () {
		return 'should return the correct posts, when a complex arrangment of posts is available, in descending order when requesting posts in default sort order';
	}

	// set the path to use for the request
	setPath (callback) {
		// sort the posts we expect by ID, so we're consistent with the response
		// when we fetch, they should be in the same order
		this.expectedPosts = this.postData.map(postData => postData.post);
		this.expectedPosts.push(this.repoPost);
		this.expectedPosts.sort((a, b) => {
			return a.id.localeCompare(b.id);
		});
		this.expectedPosts.reverse();
		this.path = `/posts?teamId=${this.team.id}`;
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

module.exports = GetComplexPostsDefaultSortTest;
