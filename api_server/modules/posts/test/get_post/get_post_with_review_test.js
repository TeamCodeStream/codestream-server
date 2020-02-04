'use strict';

const GetPostTest = require('./get_post_test');
const ReviewTestConstants = require(process.env.CS_API_TOP + '/modules/reviews/test/review_test_constants');

class GetPostWithReviewTest extends GetPostTest {

	constructor (options) {
		super(options);
		Object.assign(this.postOptions, {
			wantReview: true,
			wantMarkers: 5,
			numChanges: 2,
			changesetRepoId: this.repo.id
		});
	}

	get description () {
		return 'should return a valid post with a review and markers when requesting a post created with an attached code review and markers';
	}

	// vdlidate the response to the request
	validateResponse (data) {
		const review = data.review;
		// verify we got the right post, and that there are no attributes we don't want the client to see
		this.validateMatchingObject(this.post.reviewId, review, 'review');
		for (let i = 0; i < this.postOptions.wantMarkers; i++) {
			this.validateMatchingObject(review.markerIds[i], data.markers[i], 'marker');
		}
		this.validateSanitized(review, ReviewTestConstants.UNSANITIZED_ATTRIBUTES);
		super.validateResponse(data);
	}
}

module.exports = GetPostWithReviewTest;
