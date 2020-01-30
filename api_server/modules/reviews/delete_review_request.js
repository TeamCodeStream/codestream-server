// handle the DELETE /reviews request to delete (deactivate) a review,
// along with the associated post 

'use strict';

const DeleteRequest = require(process.env.CS_API_TOP + '/lib/util/restful/delete_request');
const PostDeleter = require(process.env.CS_API_TOP + '/modules/posts/post_deleter');

class DeleteReviewRequest extends DeleteRequest {

	// authorize the request for the current user
	async authorize () {
		// get the review, only the author or the team admin can delete it
		const reviewId = this.request.params.id.toLowerCase();
		this.review = await this.data.reviews.getById(reviewId);
		if (!this.review) {
			throw this.errorHandler.error('notFound', { info: 'review' });
		}
		this.team = await this.data.teams.getById(this.codemark.get('teamId'));
		if (!this.team) {
			throw this.errorHandler.error('notFound', { info: 'team' });	// really shouldn't happen
		}
		if (
			this.review.get('creatorId') !== this.user.id &&
			!(this.team.get('adminIds') || []).includes(this.user.id)
		) {
			throw this.errorHandler.error('deleteAuth', { reason: 'only the author or a team admin can delete the review' });
		}
	}

	async process () {
		// establish a post deleter here, rather than in the ReviewDeleter,
		// to avoid a circular require
		this.postDeleter = new PostDeleter({
			request: this,
			dontDeleteReview: true
		});
		await super.process();
	}

	async handleResponse () {
		if (this.gotError) {
			return super.handleResponse();
		}

		// put the deleted post into posts instead
		this.responseData.reviews = [this.responseData.review];
		delete this.responseData.review;

		// add any deleted post to the response
		if (this.transforms.deletedPost) {
			this.responseData.posts = this.responseData.posts || [];
			this.responseData.posts.push(this.transforms.deletedPost);
		}

		await super.handleResponse();
	}

	// after the review is deleted...
	async postProcess () {
		// need the stream for publishing
		this.stream = await this.data.streams.getById(this.review.get('streamId'));
		await this.publishReview();
	}

	// publish the review to the appropriate broadcaster channel
	async publishCodemark () {
		const message = Object.assign({}, this.responseData, {
			requestId: this.request.id
		});

		let channel;
		if (!this.stream || this.stream.get('isTeamStream')) {
			channel = `team-${this.team.id}`;
		}
		else {
			channel = `stream-${this.stream.id}`;
		}
		try {
			await this.api.services.broadcaster.publish(
				message,
				channel,
				{ request: this }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.warn(`Could not publish review delete message to channel ${channel}: ${JSON.stringify(error)}`);
		}
	}

	// describe this route for help
	static describe (module) {
		const description = DeleteRequest.describe(module);
		description.access = 'Must be the creator of the review, or an admin';
		description.returns = {
			summary: 'Returns the review with a directive to set deactivated flag to true, as well as any associated post',
			looksLike: {
				review: {
					id: '<ID of the review>',
					$set: {
						deactivated: true
					}
				},
				post: {
					id: '<ID of associated post>',
					$set: {
						deactivated: true
					}
				}
			}
		};
		description.publishes = 'Same as response, published to the stream that owns the review, or the team';
		description.errors.push('alreadyDeleted');
		return description;
	}
}

module.exports = DeleteReviewRequest;
