'use strict';

const GetReviewsTest = require('./get_reviews_test');

class GetReviewsWithMarkersTest extends GetReviewsTest {

	constructor (options) {
		super(options);
		this.postOptions.wantMarkers = 3;
	}

	get description () {
		return 'should return the correct reviews with markers when requesting reviews for a team that were created with associated markers';
	}
}

module.exports = GetReviewsWithMarkersTest;
