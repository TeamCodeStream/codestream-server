'use strict';

const DeleteCodemarkTest = require('./delete_codemark_test');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');
const Assert = require('assert');
const CodemarkTestConstants = require('../codemark_test_constants');

class DeleteMarkerTest extends DeleteCodemarkTest {

	constructor (options) {
		super(options);
		this.wantMarker = true;
	}

	get description () {
		return 'should delete associated markers when a codemark is deleted';
	}

	setExpectedData (callback) {
		super.setExpectedData(() => {
			this.expectedData.markers = [{
				id: this.markers[0].id,
				_id: this.markers[0].id,
				$set: {
					deactivated: true,
					version: 2
				},
				$version: {
					before: 1,
					after: 2
				}
			}];
			this.expectedMarker = DeepClone(this.markers[0]);
			Object.assign(this.expectedMarker, this.expectedData.markers[0].$set);
			callback();
		});
	}

	validateResponse (data) {
		const marker = data.markers[0];
		Assert(marker.$set.modifiedAt >= this.modifiedAfter, 'codemark modifiedAt is not greater than before the post was deleted');
		this.expectedData.markers[0].$set.modifiedAt = marker.$set.modifiedAt;
		this.validateSanitized(marker.$set, CodemarkTestConstants.UNSANITIZED_MARKER_ATTRIBUTES);
		super.validateResponse(data);
	}
}

module.exports = DeleteMarkerTest;
