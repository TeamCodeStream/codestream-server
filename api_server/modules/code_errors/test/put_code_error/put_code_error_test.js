// base class for many tests of the "PUT /code-error" requests

'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');
const CodeErrorTestConstants = require('../code_error_test_constants');

class PutCodeErrorTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return 'should return the updated code error when updating a code error';
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
		Assert(data.codeError.$set.modifiedAt >= this.modifiedAfter, 'modifiedAt is not greater than before the code error was updated');
		this.expectedData.codeError.$set.modifiedAt = data.codeError.$set.modifiedAt;
		// verify we got back the proper response
		Assert.deepEqual(data, this.expectedData, 'response data is not correct');
		// verify the code error in the response has no attributes that should not go to clients
		this.validateSanitized(data.codeError.$set, CodeErrorTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = PutCodeErrorTest;
