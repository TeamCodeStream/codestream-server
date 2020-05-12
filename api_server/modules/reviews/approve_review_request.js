// handle the PUT /reviews/approve/:id request to approve a review

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
const ModelSaver = require(process.env.CS_API_TOP + '/lib/util/restful/model_saver');
const ReviewPublisher = require('./review_publisher');
const ArrayUtilities = require(process.env.CS_API_TOP + '/server_utils/array_utilities');

class ApproveReviewRequest extends RestfulRequest {

	// authorize the request for the current user
	async authorize () {
		const reviewId = this.request.params.id.toLowerCase();
		this.review = await this.user.authorizeReview(reviewId, this);
		if (!this.review) {
			throw this.errorHandler.error('updateAuth', { reason: 'user is not authorized to approve this review' });
		}
	}

	// process the request...
	async process () {
		const now = Date.now();

		const op = {
			$set: {
				modifiedAt: now
			}
		};
		const existingApproval = (this.review.get('approvedBy') || {})[this.user.id];
		if (existingApproval) {
			op.$set[`approvedBy.${this.user.id}.approvedAt`] = now;
		}
		else {
			op.$set[`approvedBy.${this.user.id}`] = {
				approvedAt: now
			};
		}

		if (this.review.get('allReviewersMustApprove')) {
			const usersWhoApproved = Object.keys(this.review.get('approvedBy') || {});
			usersWhoApproved.push(this.user.id);
			if (ArrayUtilities.difference(this.review.get('reviewers') || [], usersWhoApproved).length === 0) {
				op.$set.status = 'approved';
				op.$set.approvedAt = now;
			}
		}
		else {
			op.$set.status = 'approved';
			op.$set.approvedAt = now;
		}

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
			tag: 'approve',
			summary: 'Approve a review',
			access: 'User must be a member of the team that owns the review, or if the review is within a private channel or DM, user must be a member of that stream.',
			description: 'Approve the review specified, if review is not all-must-approve, status gets changed to "approved".',
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

module.exports = ApproveReviewRequest;
