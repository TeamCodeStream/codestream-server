// handle a GET /reviews/diffs/:reviewId request to fetch the diffs associated with a review

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');

class GetReviewRequest extends RestfulRequest {

	async authorize () {
		const reviewId = this.request.params.reviewId.toLowerCase();
		this.review = await this.user.authorizeReview(reviewId, this);
		if (!this.review) {
			throw this.errorHandler.error('readAuth', { reason: 'user does not have access to this review' });
		}
	}

	async process () {
		this.responseData = this.review.get('reviewDiffs') || {};
	}

	// describe this route for help
	static describe (/*module*/) {
		/*
		const description = Restful.describe(module);
		description.description = 'Returns the review; also returns the referencing post, if any';
		description.access = 'User must be a member of the stream that owns the review';
		description.returns.summary = 'A review object, along with any referencing post',
		Object.assign(description.returns.looksLike, {
			review: '<the fetched @@#review object#review@@>',
			post: '<the @@#post object#post@@ that references this review, if any>'
		});
		return description;
		*/
	}
}

module.exports = GetReviewRequest;
