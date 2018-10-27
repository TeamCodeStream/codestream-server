'use strict';

const PostPostTest = require('./post_post_test');
const Assert = require('assert');
const PostTestConstants = require('../post_test_constants');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class ItemTest extends PostPostTest {

	get description () {
		return 'should return the post with item info when creating a post with item info';
	}

	makePostData (callback) {
		BoundAsync.series(this, [
			super.makePostData,
			this.addItemData
		], callback);
	}

	addItemData (callback) {
		this.itemFactory.getRandomItemData(
			(error, itemData) => {
				if (error) { return callback(error); }
				this.data.items = [ itemData ];
				callback();
			}
		);
	}

	/* eslint complexity: 0 */
	// validate the response to the post request
	validateResponse (data) {
		// validate that we got an item in the response
		this.validateItems(data);
		super.validateResponse(data);
	}

	// validate the items created as a result of the post containing item data
	validateItems (data) {
		const post = data.post;
		Assert(data.items.length === 1, 'length of items array is ' + data.items.length);
		const item = data.items[0];
		const inputItem = this.data.items[0];

		let errors = [];
		let result = (
			((item.teamId === this.team._id) || errors.push('teamId does not match the team')) &&
			((item.streamId === this.stream._id) || errors.push('streamId does not match the stream')) &&
			((item.postId === post._id) || errors.push('postId does not match the post')) &&
			((item.deactivated === false) || errors.push('deactivated not false')) &&
			((typeof item.createdAt === 'number') || errors.push('createdAt not number')) &&
			((item.modifiedAt >= item.createdAt) || errors.push('modifiedAt not greater than or equal to createdAt')) &&
			((item.creatorId === this.currentUser.user._id) || errors.push('creatorId not equal to current user id')) &&
			((item.type === inputItem.type) || errors.push('type does not match')) &&
			((item.status === inputItem.status) || errors.push('status does not match')) &&
			((item.color === inputItem.color) || errors.push('color does not match')) &&
			((item.text === inputItem.text) || errors.push('text does not match')) &&
			((item.title === inputItem.title) || errors.push('title does not match'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		Assert.deepEqual(post.itemIds, [ item._id ], 'itemIds is not set to array of item IDs');

		this.validateSanitized(item, PostTestConstants.UNSANITIZED_ITEM_ATTRIBUTES);
	}
}

module.exports = ItemTest;
