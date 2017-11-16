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

	setPath (callback) {
		this.myPosts.splice(0, this.numPosts - 3);
		this.path = `/posts/?teamId=${this.team._id}&streamId=${this.stream._id}&limit=3`;
		callback();
	}
}

module.exports = GetPostsLimitTest;
