'use strict';

const GetPostsTest = require('./get_posts_test');
const Assert = require('assert');

class GetPostsWithMarkersTest extends GetPostsTest {

	constructor (options) {
		super(options);
		this.postOptions.wantCodeBlock = true;
	}

	get description () {
		return 'should return the correct posts with markers when requesting posts created with code blocks';
	}

	// validate the response to the fetch request
	validateResponse (data) {
		data.posts.forEach(post => {
			Assert.equal(post.markers[0].postId, post._id, 'marker associated with post does not have the post\'s ID');
		});
		super.validateResponse(data);
	}
}

module.exports = GetPostsWithMarkersTest;
