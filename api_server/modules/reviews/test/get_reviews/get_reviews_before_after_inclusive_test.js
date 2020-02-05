'use strict';

const GetReviewsWithMarkersTest = require('./get_reviews_with_markers_test');

class GetReviewsBeforeAfterInclusiveTest extends GetReviewsWithMarkersTest {

	get description () {
		return 'should return the correct reviews when requesting reviews in a stream between timestamps, inclusive';
	}

	// set the path to use for the request
	setPath (callback) {
		// pick bracket points, then filter our expected reviews based on the brackets,
		// and specify the before and after parameters to fetch based on the brackets
		const beforePivot = this.reviews[7].createdAt;
		const afterPivot = this.reviews[3].createdAt;
		this.expectedReviews = this.reviews.filter(review => review.createdAt <= beforePivot && review.createdAt >= afterPivot);
		this.expectedReviews.reverse();
		this.path = `/reviews?teamId=${this.team.id}&before=${beforePivot}&after=${afterPivot}&inclusive`;
		callback();
	}
}

module.exports = GetReviewsBeforeAfterInclusiveTest;
