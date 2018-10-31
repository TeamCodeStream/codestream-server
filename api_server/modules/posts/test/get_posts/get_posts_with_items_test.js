'use strict';

const GetPostsTest = require('./get_posts_test');
const Assert = require('assert');

class GetPostsWithItemsTest extends GetPostsTest {

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
			const item = data.items.find(item => item._id === post.itemId);
			Assert(item, 'item not returned with post');
		});
		super.validateResponse(data);
	}
}

module.exports = GetPostsWithItemsTest;
