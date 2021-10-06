'use strict';

const GetPostsTest = require('./get_posts_test');

class GetPostsBeforeAfterInclusiveTest extends GetPostsTest {

	constructor (options) {
		super(options);
		this.postOptions.numPosts = 8;
	}

	get description () {
		return 'should return the correct posts when requesting posts with an inclusive ID range';
	}

	// set the path to use for the request
	setPath (callback) {
		// pick a pivot point, then filter our expected posts based on that pivot,
		// and specify the before parameter to fetch based on the pivot
		this.expectedPosts = this.postData.map(postData => postData.post);
		const lowerPivot = this.expectedPosts[2].id;
		const upperPivot = this.expectedPosts[5].id;
		this.expectedPosts = this.expectedPosts.filter(post => post.id >= lowerPivot && post.id <= upperPivot);
		this.path = `/posts?teamId=${this.team.id}&before=${upperPivot}&after=${lowerPivot}&inclusive`; // &streamId=${this.teamStream.id}
		callback();
	}
}

module.exports = GetPostsBeforeAfterInclusiveTest;
