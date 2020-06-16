// handle the PUT /reviews/follow/:id request to follow a review

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');
const ReviewPublisher = require('./review_publisher');

class FollowReviewRequest extends RestfulRequest {

	// authorize the request for the current user
	async authorize () {
		const reviewId = this.request.params.id.toLowerCase();
		this.review = await this.user.authorizeReview(reviewId, this);
		if (!this.review) {
			throw this.errorHandler.error('updateAuth', { reason: 'user is not authorized to follow this review' });
		}
	}

	// process the request...
	async process () {
		const followerIds = this.review.get('followerIds') || [];
		if (followerIds.indexOf(this.user.id) !== -1) {
			return;
		}

		const now = Date.now();
		const op = { 
			$addToSet: { 
				followerIds: this.user.id
			},
			$set: {
				modifiedAt: now
			}
		};
		this.updateOp = await new ModelSaver({
			request: this.request,
			collection: this.data.reviews,
			id: this.review.id
		}).save(op);
	}

	async handleResponse () {
		if (this.gotError) {
			return await super.handleResponse();
		}
		this.responseData = { review: this.updateOp };
		await super.handleResponse();
	}

	// after the response has been returned...
	async postProcess () {
		new ReviewPublisher({
			review: this.review,
			request: this,
			data: this.responseData
		}).publishReview();
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'follow',
			summary: 'Follow a review',
			access: 'User must be a member of the team that owns the review, or if the review is within a private channel or DM, user must be a member of that stream.',
			description: 'Add the current user as a follower of the review specified.',
			input: 'Specify the review ID in the request path',
			returns: {
				summary: 'A review, with directives indicating how to update the review',
				looksLike: {
					review: '<some directive>'
				}
			},
			publishes: 'The response data will be published on the team channel for the team that owns the reviews',
			errors: [
				'updateAuth',
				'notFound'
			]
		};
	}
}

module.exports = FollowReviewRequest;
