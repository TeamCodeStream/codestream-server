'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');

class ReopenTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return 'should return directives to update a review when reopening a review';
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
		const review = data.review;
		Assert(review.$set.modifiedAt >= this.modifiedAfter, 'modifiedAt is not greater than before the review was updated');
		this.expectedResponse.review.$set.modifiedAt = review.$set.modifiedAt;
		Assert.deepEqual(data, this.expectedResponse, 'response data is not correct');
	}
}

module.exports = ReopenTest;
