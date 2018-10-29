// base class for many tests of the "PUT /posts" requests

'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');
const ItemTestConstants = require('../item_test_constants');

class PutItemTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return 'should return the updated item when updating an item';
	}

	get method () {
		return 'put';
	}

	// before the test runs...
	before (callback) {
		this.init(callback);
	}

	// validate the response to the test request
	validateResponse (data) {
		// verify modifiedAt was updated, and then set it so the deepEqual works
		Assert(data.item.$set.modifiedAt > this.modifiedAfter, 'modifiedAt is not greater than before the before was updated');
		this.expectedData.item.$set.modifiedAt = data.item.$set.modifiedAt;
		// verify we got back the proper response
		Assert.deepEqual(data, this.expectedData, 'response data is not correct');
		// verify the item in the response has no attributes that should not go to clients
		this.validateSanitized(data.item.$set, ItemTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = PutItemTest;
