'use strict';

const GetPostsWithMarkersTest = require('./get_posts_with_markers_test');
const Assert = require('assert');

class GetPostsWithItemsTest extends GetPostsWithMarkersTest {

	constructor (options) {
		super(options);
		this.postOptions.wantItem = true;
	}

	get description () {
		return 'should return the correct posts with items when requesting posts created with knowledge base item attachments';
	}

	// validate the response to the fetch request
	validateResponse (data) {
		data.posts.forEach(post => {
			Assert.equal(post.items[0].postId, post._id, 'item attached to post does not have the post\'s ID');
		});
		super.validateResponse(data);
	}
}

module.exports = GetPostsWithItemsTest;
