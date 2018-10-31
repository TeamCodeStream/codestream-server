'use strict';

const PostPostTest = require('./post_post_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const ItemValidator = require(process.env.CS_API_TOP + '/modules/items/test/post_item/item_validator');

class ItemTest extends PostPostTest {

	constructor (options) {
		super(options);
		this.expectProviderType = false;
		this.streamUpdatesOk = true;
	}

	get description () {
		return 'should return the post with an item when creating a post with item info';
	}

	makePostData (callback) {
		BoundAsync.series(this, [
			super.makePostData,
			this.addItemData
		], callback);
	}

	addItemData (callback) {
		this.data.item = this.itemFactory.getRandomItemData();
		callback();
	}

	/* eslint complexity: 0 */
	// validate the response to the post request
	validateResponse (data) {
		// validate that we got an item in the response
		// verify we got back an item with the attributes we specified
		const inputItem = Object.assign(this.data.item, {
			streamId: this.stream._id,
			postId: data.post._id
		});
		new ItemValidator({
			test: this,
			inputItem
		}).validateItem(data);
		super.validateResponse(data);
	}
}

module.exports = ItemTest;
