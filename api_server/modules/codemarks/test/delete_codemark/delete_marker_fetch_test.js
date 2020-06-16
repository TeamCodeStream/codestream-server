'use strict';

const DeleteMarkerTest = require('./delete_marker_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');
const CodemarkTestConstants = require('../codemark_test_constants');

class DeleteMarkerFetchTest extends DeleteMarkerTest {

	get description () {
		return 'should delete associated marker when a codemark is deleted, checked by fetching the marker';
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
			this.deleteCodemark,	// perform the actual deletion
			this.setPath
		], callback);
	}

	setPath (callback) {
		this.path = '/markers/' + this.markers[0].id;
		callback();
	}

	// validate that the response is correct
	validateResponse (data) {
		Assert(data.marker.modifiedAt >= this.modifiedAfter, 'modifiedAt is not greater than before the post was deleted');
		this.expectedMarker.modifiedAt = data.marker.modifiedAt;
		// verify what we fetch is what we got back in the response
		Assert.deepEqual(data.marker, this.expectedMarker, 'fetched marker does not match');
	}
}

module.exports = DeleteMarkerFetchTest;
