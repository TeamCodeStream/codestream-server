'use strict';

const ReferenceLocationTest = require('./reference_location_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Assert = require('assert');
const MarkerTestConstants = require('../marker_test_constants');

class FetchTest extends ReferenceLocationTest {

	get description () {
		return 'should properly update a marker when a reference location is added, checked by fetching the codemark';
	}

	get method () {
		return 'get';
	}

	getExpectedFields () {
		return { marker: MarkerTestConstants.EXPECTED_MARKER_FIELDS };
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,	// do the usual test prep
			this.updateMarker,	// perform the actual update
			this.setPath
		], callback);
	}

	setPath (callback) {
		this.path = `/markers/${this.marker.id}`;
		callback();
	}

	// validate that the response is correct
	validateResponse (data) {
		Assert(data.marker.modifiedAt >= this.modifiedAfter, 'modifiedAt is not greater than before the codemark was updated');
		this.expectedMarker.modifiedAt = data.marker.modifiedAt;
		// verify what we fetch is what we got back in the response
		Assert.deepEqual(data.marker, this.expectedMarker, 'fetched marker does not match');
	}
}

module.exports = FetchTest;
