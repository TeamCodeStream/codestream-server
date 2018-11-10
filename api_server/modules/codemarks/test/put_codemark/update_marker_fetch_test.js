'use strict';

const UpdateMarkerTest = require('./update_marker_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Assert = require('assert');
const CodemarkTestConstants = require('../codemark_test_constants');

class UpdateMarkerFetchTest extends UpdateMarkerTest {

	get description () {
		return 'when updating a postless codemark with post ID and stream ID, any marker referenced by the codemark should also get updated, checked by fetching the marker';
	}

	get method () {
		return 'get';
	}

	getExpectedFields () {
		return { marker: CodemarkTestConstants.EXPECTED_MARKER_FIELDS };
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,	// do the usual test prep
			this.updateCodemark,	// perform the actual update
			this.setPath	// set the path for the request to fetch the marker
		], callback);
	}

	setPath (callback) {
		this.path = '/markers/' + this.markers[0]._id;
		callback();
	}

	// validate that the response is correct
	validateResponse (data) {
		Assert(data.marker.modifiedAt > this.modifiedAfter, 'modifiedAt is not greater than before the marker was updated');
		this.expectedMarker.modifiedAt = data.marker.modifiedAt;
		// verify what we fetch is what we got back in the response
		Assert.deepEqual(data.marker, this.expectedMarker, 'fetched marker does not match');
	}
}

module.exports = UpdateMarkerFetchTest;
