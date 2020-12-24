'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const ReviewTestConstants = require('../review_test_constants');
const Assert = require('assert');

class GetReviewsTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.teamOptions.creatorIndex = 1;
		this.streamOptions.creatorIndex = 1;
		this.repoOptions.creatorIndex = 1;
		Object.assign(this.postOptions, {
			numPosts: 10,
			creatorIndex: 1,
			wantReview: true,
			numChanges: 2
		});
	}

	get description () {
		return 'should return the correct reviews when requesting reviews for a team';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.setReviews,
			this.setPath
		], callback);
	}

	// set the reviews established for the test
	setReviews (callback) {
		this.reviews = this.postData.map(postData => postData.review);
		callback();
	}

	// set the path to use for the request
	setPath (callback) {
		this.expectedReviews = [...this.reviews];
		this.expectedReviews.reverse();
		this.path = `/reviews?teamId=${this.team.id}`;
		callback();
	}

	// validate correct response
	validateResponse (data) {
		// validate we got the correct reviews, and that they are sanitized (free of attributes we don't want the client to see)
		this.validateMatchingObjectsSorted(data.reviews, this.expectedReviews, 'reviews');
		this.validateSanitizedObjects(data.reviews, ReviewTestConstants.UNSANITIZED_ATTRIBUTES);

		// make sure we got a post with each review that matches the post to which the review belongs
		data.reviews.forEach(review => {
			const post = data.posts.find(post => post.id === review.postId);
			Assert(post, 'no post found for marker\'s review');
			if (this.postOptions.wantMarkers) {
				review.markerIds.forEach(markerId => {
					const marker = data.markers.find(marker => marker.id === markerId);
					Assert(marker, `no marker found for review's marker ${markerId}`);
				});
			}
		});
	}
}

module.exports = GetReviewsTest;
