// base class for many tests of the "POST /items" requests

'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const ItemTestConstants = require('../item_test_constants');
const CommonInit = require('./common_init');
const ItemValidator = require('./item_validator');

class PostItemTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	constructor (options) {
		super(options);
		this.expectProviderType = true;
	}

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
		new ItemValidator({
			test: this,
			inputItem: this.data
		}).validateItem(data);
	}
}

module.exports = PostItemTest;
