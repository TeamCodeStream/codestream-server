// base class for many tests of the "PUT /react/:id" requests

'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');
const PostTestConstants = require('../post_test_constants');

class ReactTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return 'should return a directive for updating reactions when a user reacts to a post';
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
		Assert.deepEqual(data, this.expectedData, 'incorrect response data');
		// verify the post in the response has no attributes that should not go to clients
		this.validateSanitized(data.post, PostTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = ReactTest;
