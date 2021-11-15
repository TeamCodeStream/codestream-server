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
		this.testLog('EXPECTED POSTS IN SetPath:', this.expectedPosts.map(post => post.id));
		this.expectedPosts.sort((a, b) => {
			return a.seqNum - b.seqNum;
		});
		this.testLog('EXPECTED POSTS AFTER SORTING:', this.expectedPosts.map(post => post.id));
		this.expectedPosts.splice(0, this.postOptions.numPosts - 3);
		this.testLog('EXPECTED POSTS AFTER SPLICING:', this.expectedPosts.map(post => post.id));
		this.path = `/posts?teamId=${this.team.id}&streamId=${this.teamStream.id}&limit=3`;
		callback();
	}
}

module.exports = GetPostsLimitTest;
