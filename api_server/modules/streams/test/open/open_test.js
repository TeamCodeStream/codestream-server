// base class for many tests of the "PUT /streams/open" requests

'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');

class OpenTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return 'should return an op to update user preferences and stream when a request is made to open a closed stream';
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

module.exports = OpenTest;
