// base class for many tests of the "PUT /markers/:id/reference-location" requests

'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');
const MarkerTestConstants = require('../marker_test_constants');

class ReferenceLocationTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return 'should return a directive to update the marker when adding a reference location for a marker';
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
		Assert(data.marker.$set.modifiedAt >= this.modifiedAfter, 'modifiedAt is not greater than before the before was updated');
		this.expectedData.marker.$set.modifiedAt = data.marker.$set.modifiedAt;
		// verify we got back the proper response
		Assert.deepEqual(data, this.expectedData, 'response data is not correct');
		// verify the marker in the response has no attributes that should not go to clients
		this.validateSanitized(data.marker.$set, MarkerTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = ReferenceLocationTest;
