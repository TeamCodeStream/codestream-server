// base class for many tests of the "PUT /markers/:id/move" requests

'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');
const MarkerTestConstants = require('../marker_test_constants');

class DeleteTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return 'should return directives to update the marker and its parent codemark when a marker is deleted';
	}

	get method () {
		return 'delete';
	}

	// before the test runs...
	before (callback) {
		this.init(callback);
	}

	// validate the response to the test request
	validateResponse (data) {
		const expectedUpdatedMarker = this.getExpectedUpdatedMarker(data);
		const expectedUpdatedCodemark = this.getExpectedUpdatedCodemark(data);

		const expectedData = {
			marker: expectedUpdatedMarker,
			codemark: expectedUpdatedCodemark
		};

		Assert.deepEqual(data, expectedData, 'response is not correct');

		// verify the marker in the response has no attributes that should not go to clients
		this.validateSanitized(data.marker.$set, MarkerTestConstants.UNSANITIZED_ATTRIBUTES);
		this.validateSanitized(data.codemark.$set, MarkerTestConstants.UNSANITIZED_CODEMARK_ATTRIBUTES);
	}

	getExpectedUpdatedMarker (data) {
		const modifiedAt = data.marker.$set.modifiedAt;
		Assert(modifiedAt >= this.modifiedAfter, 'modifiedAt of updated marker is not greater than before the test request was made');
		return {
			_id: this.marker.id,	// DEPRECATE ME
			id: this.marker.id,
			$set: {
				deactivated: true,
				version: 2,
				modifiedAt
			},
			$version: {
				before: 1,
				after: 2
			}
		};
	}

	getExpectedUpdatedCodemark (data) {
		const modifiedAt = data.codemark.$set.modifiedAt;
		const markerIds = this.codemark.markerIds;
		markerIds.splice(this.deletedMarkerIndex, 1);
		const fileStreamIds = this.codemark.fileStreamIds;
		fileStreamIds.splice(this.deletedMarkerIndex, 1);
		Assert(modifiedAt >= this.modifiedAfter, 'modifiedAt of updated codemark is not greater than before the test request was made');
		return {
			_id: this.codemark.id,	// DEPRECATE ME
			id: this.codemark.id,
			$set: {
				version: 2,
				modifiedAt: modifiedAt,
				markerIds,
				fileStreamIds
			},
			$version: {
				before: 1,
				after: 2
			}
		};
	}
}

module.exports = DeleteTest;
