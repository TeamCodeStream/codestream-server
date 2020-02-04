// handle the "GET /changesets" request to fetch multiple changesets

'use strict';

const GetManyRequest = require(process.env.CS_API_TOP + '/lib/util/restful/get_many_request');
const Indexes = require('./indexes');

class GetChangesetsRequest extends GetManyRequest {

	// authorize the request
	async authorize () {
		let reviewId = this.request.query.reviewId;
		if (!reviewId) {
			throw this.errorHandler.error('parameterRequired', { info: 'reviewId' });
		}
		reviewId = reviewId.toLowerCase();
		this.review = await this.user.authorizeReview(reviewId, this);
		if (!this.review) {
			throw this.errorHandler.error('readAuth', { info: 'must have access to the review' });
		}
	}

	// build the database query to use to fetch the changesets
	buildQuery () {
		return {
			teamId: this.review.get('teamId'),
			reviewId: this.review.id
		};
	}

	// get database options to associate with the database fetch request
	getQueryOptions () {
		return { 
			hint: Indexes.byReviewId
		};
	}

	// describe this route for help
	static describe (module) {
		const description = GetManyRequest.describe(module);
		description.description = 'Returns an array of changesets for a given review, specified by the reviewId given as a query parameter.';
		description.access = 'User must have access to the review';
		Object.assign(description.input.looksLike, {
			'reviewId*': '<ID of the review for which changesets are being fetched>'
		});
		description.returns.summary = 'An array of changeset objects';
		Object.assign(description.returns.looksLike, {
			changesets: '<@@#changeset objects#changeset@@ fetched>'
		});
		description.errors = description.errors.concat([
			'parameterRequired'
		]);
		return description;
	}
}

module.exports = GetChangesetsRequest;
