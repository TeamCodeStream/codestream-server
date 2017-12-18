'use strict';

var GetPostsTest = require('./get_posts_test');

class GetPostsLimitTest extends GetPostsTest {

	constructor (options) {
		super(options);
		this.numPosts = 10;
	}

	get description () {
		return 'should return the correct posts when requesting a limited number of posts';
	}

	// set the path to use for the request
	setPath (callback) {
		// sort by ID so we're consistent with expectations, take a slice of the posts equal to the
		// size we're going to limit to, then use the limit parameter to fetch
		this.myPosts.sort((a, b) => {
			return a._id.localeCompare(b._id);
		});
		this.myPosts.splice(0, this.numPosts - 3);
		this.path = `/posts/?teamId=${this.team._id}&streamId=${this.stream._id}&limit=3`;
		callback();
	}
}

module.exports = GetPostsLimitTest;
