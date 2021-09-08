'use strict';

const MoveTest = require('./move_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');
const MarkerTestConstants = require('../marker_test_constants');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');

class FetchSupersededMarkerTest extends MoveTest {

	get description () {
		return 'should properly update the superseded marker when its code block is moved, checked by fetching the marker';
	}

	get method () {
		return 'get';
	}

	getExpectedFields () {
		const expectedFields = { marker: [...MarkerTestConstants.EXPECTED_MARKER_FIELDS] };
		expectedFields.marker.push('supersededByMarkerId');
		return expectedFields;
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,	// do the usual test prep
			this.moveMarker,	// perform the actual update
			this.setPath
		], callback);
	}

	setPath (callback) {
		this.path = `/markers/${this.marker.id}`;
		callback();
	}

	// validate that the response is correct
	validateResponse (data) {
		const expectedMarker = DeepClone(this.marker);
		Assert(data.marker.modifiedAt >= this.modifiedAfter, 'modifiedAt is not greater than before the codemark was updated');
		expectedMarker.modifiedAt = data.marker.modifiedAt;
		expectedMarker.version++;
		expectedMarker.supersededByMarkerId = this.createdMarker.id;
		// verify what we fetch is what we got back in the response
		Assert.deepEqual(data.marker, expectedMarker, 'fetched marker does not match');
	}
}

module.exports = FetchSupersededMarkerTest;
