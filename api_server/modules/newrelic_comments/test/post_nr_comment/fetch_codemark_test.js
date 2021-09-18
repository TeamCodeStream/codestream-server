'use strict';

const MoveTest = require('./move_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');

class FetchCodemarkTest extends MoveTest {

	get description () {
		return 'should properly update the codemark by adding a new marker, when the code block for a marker is moved';
	}

	get method () {
		return 'get';
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
		this.path = `/codemarks/${this.marker.codemarkId}`;
		callback();
	}

	// validate that the response is correct
	validateResponse (data) {
		const expectedCodemark = DeepClone(this.codemark);
		Assert(data.codemark.modifiedAt >= this.modifiedAfter, 'modifiedAt is not greater than before the codemark was updated');
		expectedCodemark.modifiedAt = data.codemark.modifiedAt;
		expectedCodemark.version++;
		expectedCodemark.markerIds.push(this.createdMarker.id);
		expectedCodemark.fileStreamIds.push(this.createdMarker.fileStreamId);
		// verify what we fetch is what we got back in the response
		Assert.deepEqual(data.codemark, expectedCodemark, 'fetched codemark does not match');
	}
}

module.exports = FetchCodemarkTest;
