// base class for many tests of the "POST /items" requests

'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const ItemTestConstants = require('../item_test_constants');
const CommonInit = require('./common_init');

class PostItemTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return 'should return a valid item when creating an item tied to a third-party post';
	}

	get method () {
		return 'post';
	}

	get path () {
		return '/items';
	}

	getExpectedFields () {
		const expectedFields = ItemTestConstants.EXPECTED_ITEM_FIELDS;
		return { item: expectedFields };
	}

	// before the test runs...
	before (callback) {
		this.init(callback);
	}

	/* eslint complexity: 0 */
	// validate the response to the test request
	validateResponse (data) {
		// verify we got back an item with the attributes we specified
		const item = data.item;
		let errors = [];
		let result = (
			((item.teamId === this.team._id) || errors.push('teamId does not match the team')) &&
			((item.streamId === this.data.streamId) || errors.push('streamId does not match the stream')) &&
			((item.postId === this.data.postId) || errors.push('postId does not match the post')) &&
			((item.deactivated === false) || errors.push('deactivated not false')) &&
			((typeof item.createdAt === 'number') || errors.push('createdAt not number')) &&
			((item.modifiedAt >= item.createdAt) || errors.push('modifiedAt not greater than or equal to createdAt')) &&
			((item.creatorId === this.currentUser.user._id) || errors.push('creatorId not equal to current user id')) &&
			((item.type === this.data.type) || errors.push('type does not match')) &&
			((item.status === this.data.status) || errors.push('status does not match')) &&
			((item.color === this.data.color) || errors.push('color does not match')) &&
			((item.text === this.data.text) || errors.push('text does not match')) &&
			((item.title === this.data.title) || errors.push('title does not match'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));

		// verify the item in the response has no attributes that should not go to clients
		this.validateSanitized(item, ItemTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = PostItemTest;
