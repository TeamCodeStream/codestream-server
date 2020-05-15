// handle a GET /reviews/diffs/:reviewId request to fetch the diffs associated with a review

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');

class GetCheckpointReviewDiffsRequest extends RestfulRequest {

	async authorize () {
		const reviewId = this.request.params.reviewId.toLowerCase();
		this.review = await this.user.authorizeReview(reviewId, this);
		if (!this.review) {
			throw this.errorHandler.error('readAuth', { reason: 'user does not have access to this review' });
		}
	}

	async process () {
		const checkpointReviewDiffs = this.review.get('checkpointReviewDiffs');
		if (checkpointReviewDiffs && !this.request.query._testLegacyResponse) {
			this.responseData = checkpointReviewDiffs;
			return;
		}

		// for legacy reviews, turn from the old reviewDiffs hash into an array
		const reviewDiffs = this.review.get('reviewDiffs') || {};
		this.responseData = Object.keys(reviewDiffs).map(repoId => {
			return {
				repoId,
				diffs: reviewDiffs[repoId]
			};
		});
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'checkpoint-review-diffs',
			summary: 'Return checkpoint diffs associated with a review',
			access: 'Current user must be a member of the team that owns the review',
			description: 'Given a review ID, returns the set of diffs associated with that review, per the checkpoint scheme.',
			input: 'Specify the review ID in the url',
			returns: {
				summary: 'Returns an array of diff objects, each object has a repo ID indicating the repo the diffs are associated with, and possibly a checkpoint number, in addition to other diff-related attributes',
				looksLike: [
					'<diff object>',
					'...'
				]
			},
			errors: [
				'readAuth',
				'notFound'
			]
		};
	}
}

module.exports = GetCheckpointReviewDiffsRequest;
