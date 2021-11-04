'use strict';

const GetPostsTest = require('./get_posts_test');

class GetPostsLimitTest extends GetPostsTest {

	constructor (options) {
		super(options);
		this.postOptions.numPosts = 10;
	}

	get description () {
		return 'should return the correct posts when requesting a limited number of posts';
	}

	// set the path to use for the request
	setPath (callback) {
		// sort by ID so we're consistent with expectations, take a slice of the posts equal to the
		// size we're going to limit to, then use the limit parameter to fetch
		this.expectedPosts = this.postData.map(postData => postData.post);
		this.expectedPosts.sort((a, b) => {
			return a.id.localeCompare(b.id);
		});
		this.expectedPosts.splice(0, this.postOptions.numPosts - 3);
		this.path = `/posts?teamId=${this.team.id}&limit=3`; // &streamId=${this.teamStream.id}
		callback();
	}
}

module.exports = GetPostsLimitTest;
