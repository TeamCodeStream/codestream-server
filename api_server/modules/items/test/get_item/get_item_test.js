'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const ItemTestConstants = require('../item_test_constants');

class GetItemTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.teamOptions.creatorIndex = 1;
		this.streamOptions.creatorIndex = 1;
		Object.assign(this.postOptions, {
			creatorIndex: 1,
			wantItem: true
		});
	}

	get description () {
		return 'should return the item when requesting an item';
	}

	getExpectedFields () {
		return { item: ItemTestConstants.EXPECTED_ITEM_FIELDS };
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.setPath			// set the path for the request
		], callback);
	}

	// set the path to use for the request
	setPath (callback) {
		// try to fetch the item
		this.item = this.postData[0].item;
		this.path = '/items/' + this.item._id;
		callback();
	}

	// validate the request response
	validateResponse (data) {
		// validate we got the correct item, and that we only got sanitized attributes
		this.validateMatchingObject(this.item._id, data.item, 'item');
		this.validateSanitized(data.item, ItemTestConstants.UNSANITIZED_ATTRIBUTES);

		// validate we also got the parent post, with only sanitized attributes
		this.validateMatchingObject(this.postData[0].post._id, data.post, 'post');
		this.validateSanitized(data.post, ItemTestConstants.UNSANITIZED_POST_ATTRIBUTES);
	}
}

module.exports = GetItemTest;
