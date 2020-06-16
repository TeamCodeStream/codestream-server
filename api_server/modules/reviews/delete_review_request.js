// handle the DELETE /reviews request to delete (deactivate) a review,
// along with the associated post 

'use strict';

const DeleteRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/delete_request');
const PostDeleter = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/posts/post_deleter');

class DeleteReviewRequest extends DeleteRequest {

	// authorize the request for the current user
	async authorize () {
		// get the review, only the author or the team admin can delete it
		const reviewId = this.request.params.id.toLowerCase();
		this.review = await this.data.reviews.getById(reviewId, { excludeFields: ['reviewDiffs', 'checkpointReviewDiffs'] });
		if (!this.review) {
			throw this.errorHandler.error('notFound', { info: 'review' });
		}
		this.team = await this.data.teams.getById(this.review.get('teamId'));
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
		// use a post deleter to delete the review's referencing post
		// this will end up deleting the review and all its replies and codemarks and markers,
		// the whole shebang!
		this.postDeleter = new PostDeleter({
			request: this
		});
		await this.postDeleter.deletePost(this.review.get('postId'));
	}

	async handleResponse () {
		if (this.gotError) {
			return super.handleResponse();
		}

		await this.postDeleter.handleResponse(this.responseData);
		await super.handleResponse();
	}

	// after the review is deleted...
	async postProcess () {
		return await this.postDeleter.postProcess();
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
