// base class for many tests of the "PUT /posts" requests

'use strict';

var Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
var Assert = require('assert');
var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var CommonInit = require('./common_init');
const MarkerTestConstants = require('../marker_test_constants');

class PutMarkerTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return 'should return the updated marker when updating a marker';
	}

	get method () {
		return 'put';
	}

	getExpectedFields () {
		return { marker: ['commitHashWhenCreated'] };
	}

	// before the test runs...
	before (callback) {
		this.init(callback);
	}

	// validate the response to the test request
	validateResponse (data) {
		// verify we got back a marker with the updated commit hash
		let marker = data.marker;
		Assert(marker._id === this.marker._id, 'returned marker` ID is not the same');
		Assert.equal(marker.commitHashWhenCreated, this.data.commitHashWhenCreated, 'commitHashWhenCreated does not match');
		// verify the post in the response has no attributes that should not go to clients
		this.validateSanitized(marker, MarkerTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = PutMarkerTest;
