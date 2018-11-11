'use strict';

const DeleteCodemarkTest = require('./delete_codemark_test');
const DeepClone = require(process.env.CS_API_TOP + '/server_utils/deep_clone');
const Assert = require('assert');
const PostTestConstants = require('../post_test_constants');

class DeleteMarkerTest extends DeleteCodemarkTest {

	get description () {
		return 'should delete associated markers when a post is deleted';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.postOptions.wantMarker = true;
			callback();
		});
	}

	setExpectedData (callback) {
		const postData = this.postData[this.testPost];
		super.setExpectedData(() => {
			this.expectedData.markers = [{
				_id: postData.markers[0]._id,
				$set: {
					deactivated: true,
					version: 2
				},
				$version: {
					before: 1,
					after: 2
				}
			}];
			this.expectedMarker = DeepClone(postData.markers[0]);
			Object.assign(this.expectedMarker, this.expectedData.markers[0].$set);
			callback();
		});
	}

	validateResponse (data) {
		const marker = data.markers[0];
		Assert(marker.$set.modifiedAt > this.modifiedAfter, 'codemark modifiedAt is not greater than before the post was deleted');
		this.expectedData.markers[0].$set.modifiedAt = marker.$set.modifiedAt;
		this.validateSanitized(marker.$set, PostTestConstants.UNSANITIZED_MARKER_ATTRIBUTES);
		super.validateResponse(data);
	}
}

module.exports = DeleteMarkerTest;
