'use strict';

const DeleteCodeErrorTest = require('./delete_code_error_test');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');
const Assert = require('assert');
const MarkerTestConstants = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/markers/test/marker_test_constants');

class DeleteMarkersTest extends DeleteCodeErrorTest {

	constructor (options) {
		super(options);
		this.wantMarker = true;
	}

	get description () {
		return 'should delete associated markers when a code error is deleted';
	}

	setExpectedData (callback) {
		super.setExpectedData(() => {
			this.expectedData.markers = [];
			this.expectedMarkers = [];
			this.markers.forEach(marker => {
				const set = {
					deactivated: true,
					version: 2
				};
				this.expectedData.markers.push({
					id: marker.id,
					_id: marker.id,
					$set: set,
					$version: {
						before: 1,
						after: 2
					}
				});
				const expectedMarker = DeepClone(marker);
				Object.assign(expectedMarker, set);
				this.expectedMarkers.push(expectedMarker);
			});
			this.expectedMarkers.sort((a, b) => {
				return a.id.localeCompare(b.id);
			});
			this.expectedData.markers.sort((a, b) => {
				return a.id.localeCompare(b.id);
			});
			callback();
		});
	}

	validateResponse (data) {
		data.markers.sort((a, b) => {
			return a.id.localeCompare(b.id);
		});
		for (let i = 0; i < this.expectedData.markers.length; i++) {
			const marker = data.markers[i];
			const expectedMarker = this.expectedData.markers[i];
			Assert(marker.$set.modifiedAt >= this.modifiedAfter, 'code error modifiedAt is not greater than before the post was deleted');
			expectedMarker.$set.modifiedAt = marker.$set.modifiedAt;
			this.validateSanitized(marker.$set, MarkerTestConstants.UNSANITIZED_ATTRIBUTES);
		}
		super.validateResponse(data);
	}
}

module.exports = DeleteMarkersTest;
