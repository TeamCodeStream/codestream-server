'use strict';

const DeleteReviewTest = require('./delete_review_test');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');
const Assert = require('assert');
const PostTestConstants = require('../post_test_constants');

class DeleteReviewMarkersTest extends DeleteReviewTest {

	get description () {
		return 'should delete associated markers when a post with a review is deleted';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			Object.assign(this.postOptions, {
				wantReview: true,
				wantMarkers: 3,
				numChanges: 2
			})
			callback();
		});
	}

	setExpectedData (callback) {
		const postData = this.postData[this.testPost];
		super.setExpectedData(() => {
			this.expectedData.markers = [];
			this.expectedMarkers = [];
			for (let i = 0; i < postData.markers.length; i++) {
				this.expectedData.markers.push({
					_id: postData.markers[i].id,	// DEPRECATE ME
					id: postData.markers[i].id,
					$set: {
						deactivated: true,
						version: 2
					},
					$version: {
						before: 1,
						after: 2
					}
				});		
				const expectedMarker = DeepClone(postData.markers[i]);
				Object.assign(expectedMarker, this.expectedData.markers[i].$set);
				this.expectedMarkers.push(expectedMarker);	
			}
			callback();
		});
	}

	validateResponse (data) {
		const postData = this.postData[this.testPost];
		for (let i = 0; i < postData.markers.length; i++) {
			const marker = data.markers[i];
			Assert(marker.$set.modifiedAt >= this.modifiedAfter, 'review modifiedAt is not greater than before the post was deleted');
			this.expectedData.markers[i].$set.modifiedAt = marker.$set.modifiedAt;
			this.validateSanitized(marker.$set, PostTestConstants.UNSANITIZED_MARKER_ATTRIBUTES);
		}
		super.validateResponse(data);
	}
}

module.exports = DeleteReviewMarkersTest;
