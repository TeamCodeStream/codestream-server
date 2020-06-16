// base class for many tests of the "PUT /close" requests

'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');

class CloseTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return 'should return an op to update user preferences and stream when a request is made to close a stream';
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
		Assert(data.user.$set.modifiedAt >= this.updatedAt, 'modifiedAt not changed');
		this.expectedResponse.user.$set.modifiedAt = data.user.$set.modifiedAt;
		// verify we got back the expected response
		Assert.deepEqual(data, this.expectedResponse, 'response is not correct');
	}
}

module.exports = CloseTest;
