'use strict';

const GetPostsTest = require('./get_posts_test');
const Assert = require('assert');

class GetPostsWithReviewsTest extends GetPostsTest {

	constructor (options) {
		super(options);
		this.repoOptions.creatorIndex = 1;
		Object.assign(this.postOptions, {
			wantReview: true,
			wantMarkers: 5,
			numChanges: 2
		});
	}

	get description () {
		return 'should return the correct posts with reviews when requesting posts created with review and marker attachments';
	}

	// validate the response to the fetch request
	validateResponse (data) {
		data.posts.forEach(post => {
			const review = data.reviews.find(review => review.id === post.reviewId);
			Assert(review, 'review not returned with post');
			review.markerIds.forEach(markerId => {
				const marker = data.markers.find(marker => marker.id === markerId);
				Assert(marker, 'marker not returned with post');
			});
		});
		super.validateResponse(data);
	}
}

module.exports = GetPostsWithReviewsTest;
