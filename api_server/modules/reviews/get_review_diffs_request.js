// handle a GET /reviews/diffs/:reviewId request to fetch the diffs associated with a review

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request');

class GetReviewDiffsRequest extends RestfulRequest {

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
	static describe () {
		return {
			tag: 'review-diffs',
			summary: 'Return diffs associated with a review',
			access: 'Current user must be a member of the team that owns the review',
			description: 'Given a review ID, returns the set of diffs associated with that review.',
			input: 'Specify the review ID in the url',
			returns: {
				summary: 'Returns the diffs object, which has keys that are repo ID, representing the set of diffs for each repo',
				looksLike: {
					'<repoId>': '<diffs associated with the repo'
				}
			},
			errors: [
				'readAuth',
				'notFound'
			]
		};
	}
}

module.exports = GetReviewDiffsRequest;
