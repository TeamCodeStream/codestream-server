'use strict';

const GetPostWithMarkerTest = require('./get_post_with_marker_test');
const PostTestConstants = require('../post_test_constants');

class GetPostWithItemTest extends GetPostWithMarkerTest {

	constructor (options) {
		super(options);
		this.postOptions.wantItem = true;
	}

	get description () {
		return 'should return a valid post with an item when requesting a post created with an attached item';
	}

	// vdlidate the response to the request
	validateResponse (data) {
		const item = data.post.items[0];
		// verify we got the right post, and that there are no attributes we don't want the client to see
		this.validateMatchingObject(this.post.itemIds[0], item, 'item');
		this.validateSanitized(item, PostTestConstants.UNSANITIZED_ITEM_ATTRIBUTES);
	}
}

module.exports = GetPostWithItemTest;
