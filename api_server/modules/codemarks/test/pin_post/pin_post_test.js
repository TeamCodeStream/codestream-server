// base class for many tests of the "PUT /pin-post" requests

'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');
const CodemarkTestConstants = require('../codemark_test_constants');

class PinPostTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return 'should return the updated codemark when pinning a post to a codemark';
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
		Assert(data.codemark.$set.modifiedAt >= this.modifiedAfter, 'modifiedAt is not greater than before the before was updated');
		this.expectedData.codemark.$set.modifiedAt = data.codemark.$set.modifiedAt;
		// verify we got back the proper response
		Assert.deepEqual(data, this.expectedData, 'response data is not correct');
		// verify the codemark in the response has no attributes that should not go to clients
		this.validateSanitized(data.codemark.$set, CodemarkTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = PinPostTest;
