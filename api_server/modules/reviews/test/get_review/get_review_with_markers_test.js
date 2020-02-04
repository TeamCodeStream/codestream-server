'use strict';

const GetReviewTest = require('./get_review_test');
const MarkerTestConstants = require(process.env.CS_API_TOP + '/modules/markers/test/marker_test_constants');

class GetReviewWithMarkersTest extends GetReviewTest {

	constructor (options) {
		super(options);
		this.postOptions.wantMarkers = 3;
	}

	get description () {
		return 'should return the review with markers when requesting a review with markers';
	}

	// validate the request response
	validateResponse (data) {
		// validate we got the markers we expect, and that we only got sanitized attributes
		const review = data.review;
		this.validateMatchingObjects(review.markerIds, data.markers.map(m => m.id), 'markers');
		for (let marker of data.markers) {
			this.validateSanitized(marker, MarkerTestConstants.UNSANITIZED_ATTRIBUTES);
		}
		super.validateResponse(data);
	}
}

module.exports = GetReviewWithMarkersTest;
