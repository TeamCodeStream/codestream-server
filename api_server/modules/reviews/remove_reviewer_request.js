// handle the PUT /reviews/remove-reviewer/:id request to remove a reviewer of a code review

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
const ModelSaver = require(process.env.CS_API_TOP + '/lib/util/restful/model_saver');
const ReviewPublisher = require('./review_publisher');

class RemoveReviewerRequest extends RestfulRequest {

	// authorize the request for the current user
	async authorize () {
		const reviewId = this.request.params.id.toLowerCase();
		this.review = await this.user.authorizeReview(reviewId, this, { excludeFields: ['reviewDiffs'] });
		if (!this.review) {
			throw this.errorHandler.error('updateAuth', { reason: 'user is not authorized to remove reviewers from this review' });
		}
	}

	// process the request...
	async process () {
		await this.requireAndAllow();	// require parameters, and filter out unknown parameters

		const userId = (this.request.body.userId || this.user.id).toLowerCase();
		const now = Date.now();
		const op = { 
			$pull: { 
				reviewers: userId
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

	// require certain parameters, and discard unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters(
			'body',
			{
				optional: {
					string: ['userId']
				}
			}
		);
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
			tag: 'remove-reviewer',
			summary: 'Remove a user as a reviewer of a code review',
			access: 'User must be a member of the team that owns the review, or if the review is within a private channel or DM, user must be a member of that stream.',
			description: 'Remove the provided user or the current user as a reviewer of the code review specified.',
			input: {
				summary: 'Specify the review ID in the request path. If removing someone else other than the current user as a reviewer, provide the user ID in the request body',
				looksLike: {
					'userId': '<ID of user to remove; if not provided, the user making the request is removed>'
				}
			},
			returns: {
				summary: 'A review, with directives indicating how to update the review',
				looksLike: {
					review: '<some directive>'
				}
			},
			publishes: 'The response data will be published on the team channel for the team that owns the review',
			errors: [
				'updateAuth',
				'notFound'
			]
		};
	}
}

module.exports = RemoveReviewerRequest;
