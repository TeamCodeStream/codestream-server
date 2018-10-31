'use strict';

const GetPostTest = require('./get_post_test');
const PostTestConstants = require('../post_test_constants');

class GetPostWithItemTest extends GetPostTest {

	constructor (options) {
		super(options);
		this.postOptions.wantItem = true;
	}

	get description () {
		return 'should return a valid post with an item when requesting a post created with an attached item';
	}

	// vdlidate the response to the request
	validateResponse (data) {
		const item = data.item;
		// verify we got the right post, and that there are no attributes we don't want the client to see
		this.validateMatchingObject(this.post.itemId, item, 'item');
		this.validateSanitized(item, PostTestConstants.UNSANITIZED_ITEM_ATTRIBUTES);
		super.validateResponse(data);
	}
}

module.exports = GetPostWithItemTest;
