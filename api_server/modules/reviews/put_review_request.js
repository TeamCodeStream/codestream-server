// handle the PUT /reviews request to edit attributes of a review

'use strict';

const PutRequest = require(process.env.CS_API_TOP + '/lib/util/restful/put_request');
const ReviewPublisher = require('./review_publisher');

class PutReviewRequest extends PutRequest {

	// authorize the request for the current user
	async authorize () {
		// first get the review
		const reviewId = this.request.params.id.toLowerCase();
		this.review = await this.data.reviews.getById(reviewId, { excludeFields: ['reviewDiff'] });
		if (!this.review) {
			throw this.errorHandler.error('notFound', { info: 'review' });
		}

		// in the most general case, the author can edit anything they want about a review
		if (this.review.get('creatorId') === this.user.id) {
			return;
		}

		// the rest can only be done by other members of the team
		if (!this.user.hasTeam(this.review.get('teamId'))) {
			throw this.errorHandler.error('updateAuth', { reason: 'user must be on the team that owns the review' });
		}

		// team members can only change a review's status
		if (Object.keys(this.request.body).find(attribute => {
			return ['status'].indexOf(attribute) === -1;
		})) {
			throw this.errorHandler.error('updateAuth', { reason: 'only the creator of the review can make this update' });
		}
	}

	// after the review is updated...
	async postProcess () {
		await this.publishReview();
	}

	// publish the review to the appropriate broadcaster channel(s)
	async publishReview () {
		await new ReviewPublisher({
			review: this.review,
			request: this,
			data: this.responseData
		}).publishReview();
	}

	// describe this route for help
	static describe (module) {
		const description = PutRequest.describe(module);
		description.access = 'Only the creator of a review can update it, with the exception of status';
		description.input = {
			summary: description.input,
			looksLike: {
				'title': '<Change the title of the review>',
				'text': '<Change the text of the review>',
				'status': '<Change the status of the review>',
				'$push': {
					reviewers: '<Array of IDs representing users to add as reviewers to the review>'
				},
				'$pull': {
					reviewers: '<Array of IDs representing users to remove as reviewers of the review>'
				}
			}
		};
		description.publishes = {
			summary: 'Publishes the updated review attributes to the team channel for the team that owns the review, or to the stream channel if using CodeStream streams',
			looksLike: {
				'review': '<@@#review object#review@@>'
			}
		};
		return description;
	}
}

module.exports = PutReviewRequest;
