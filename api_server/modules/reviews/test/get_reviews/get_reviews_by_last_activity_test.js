'use strict';

const GetReviewsWithMarkersTest = require('./get_reviews_with_markers_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const RandomString = require('randomstring');

class GetReviewsByLastActivityTest extends GetReviewsWithMarkersTest {

	get description () {
		return 'should return the correct reviews in correct order when requesting reviews for a team and by last activity';
	}


	setPath (callback) {
		// set path, and then reply to a couple of the reviews, which should boost their lastActivityAt
		// any of those posts
		BoundAsync.series(this, [
			super.setPath,
			this.replyToReviews
		], callback);
	}

	replyToReviews (callback) {
		const reviewsToReplyTo = [3, 8, 6, 2, 7, 4];
		this.path += '&byLastActivityAt=1';
		BoundAsync.forEachSeries(
			this,
			reviewsToReplyTo,
			this.replyToReview,
			callback
		);
	}

	replyToReview (nReview, callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/posts',
				data: {
					parentPostId: this.expectedReviews[nReview].postId,
					streamId: this.stream.id,
					text: RandomString.generate(50)
				},
				token: this.users[1].accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.expectedReviews[nReview].lastActivityAt = response.reviews[0].$set.lastActivityAt;
				this.expectedReviews.unshift(this.expectedReviews[nReview]);
				this.expectedReviews.splice(nReview + 1, 1);
				callback();
			}
		);
	}
}

module.exports = GetReviewsByLastActivityTest;
