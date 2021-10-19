'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');
const MarkerValidator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/markers/test/marker_validator');

class AddMarkersTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	constructor (options) {
		super(options);
		this.expectedVersion = 2;
	}

	get description () {
		return 'should return new markers and directives to update a codemark when adding markers to a codemark';
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
		const codemark = data.codemark;
		Assert(codemark.$set.modifiedAt >= this.modifiedAfter, 'modifiedAt is not greater than before the before was updated');
		this.expectedResponse.codemark.$set.modifiedAt = codemark.$set.modifiedAt;

		// verify the marker IDs are in the correct location
		const at = this.addMarkersAt === undefined ? this.codemark.markerIds.length : this.addMarkersAt;
		for (let i = 0; i < data.markers.length; i++) {
			const createdMarker = data.markers[i];
			Assert(createdMarker.createdAt >= this.modifiedAfter, `createdAt of marker ${i} is not greater than or equal to when the request was made`);
			Assert(createdMarker.modifiedAt >= this.modifiedAfter, `createdAt of marker ${i} is not greater than or equal to when the request was made`);
			this.expectedResponse.codemark.$set.markerIds[at + i] = createdMarker.id;
			this.expectedResponse.codemark.$set.fileStreamIds[at + i] = createdMarker.fileStreamId;
		}

		this.codemark.markerIds = data.codemark.$set.markerIds;
		this.codemark.fileStreamIds = data.codemark.$set.fileStreamIds;
		new MarkerValidator({
			test: this,
			objectName: 'codemark',
			inputObject: this.codemark,
			outputObject: this.codemark,
			inputMarkers: this.addedMarkers,
			usingCodeStreamChannels: true,
			expectMarkers: this.addedMarkers.length,
			outputMarkerOffset: at
		}).validateMarkers(data);

		this.expectedResponse.markers = data.markers;
		if (data.repos) {
			this.expectedResponse.repos = data.repos;
		}
		if (data.markerLocations) {
			this.expectedResponse.markerLocations = data.markerLocations;
		}
		if (data.streams) {
			this.expectedResponse.streams = data.streams;
		}
		Assert.deepEqual(data, this.expectedResponse, 'response data is not correct');
	}
}

module.exports = AddMarkersTest;
