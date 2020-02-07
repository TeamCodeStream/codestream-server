// handle the PUT /reviews request to edit attributes of a review

'use strict';

const PutRequest = require(process.env.CS_API_TOP + '/lib/util/restful/put_request');
const ReviewPublisher = require('./review_publisher');

class PutReviewRequest extends PutRequest {

	// authorize the request for the current user
	async authorize () {
		// first get the review
		this.review = await this.data.reviews.getById(this.request.params.id);
		if (!this.review) {
			throw this.errorHandler.error('notFound', { info: 'codemark' });
		}
		delete this.review.attributes.reviewDiffs; // FIXMENOW

		// in the most general case, the author can edit anything they want about a review
		if (this.review.get('creatorId') === this.user.id) {
			return;
		}

		// the rest can only be done by other members of the team
		if (!this.user.hasTeam(this.codemark.get('teamId'))) {
			throw this.errorHandler.error('updateAuth', { reason: 'user must be on the team that owns the review' });
		}

		// TODO: 
	}

	// process the request itself...
	async process () {
		this.wantEmailNotification = this.request.body.wantEmailNotification;
		delete this.request.body.wantEmailNotification;
		return super.process();
	}

	// after the review is updated...
	async postProcess () {
		await this.publishReview();
		if (this.wantEmailNotification) {
			this.sendEmailNotification();
		}
	}

	// publish the review to the appropriate broadcaster channel(s)
	async publishReview () {
		await new ReviewPublisher({
			review: this.review,
			request: this,
			data: this.responseData
		}).publishReview();
	}

	// send email notifications to followers of the review
	sendEmailNotification () {
		const postId = this.updater.review.get('postId');
		const message = {
			type: 'notification_v2',
			postId
		};
		this.log(`Triggering V2 email notifications for post ${postId}...`);
		this.api.services.email.queueEmailSend(message, { request: this.request });
	}

	// describe this route for help
	static describe (module) {
		const description = PutRequest.describe(module);
		description.access = 'Only the creator of a review can update it <TBD>';
		description.input = {
			summary: description.input,
			looksLike: {
				'title': '<Change the title of the review>',
				'description': '<Change the description of the review>'
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
