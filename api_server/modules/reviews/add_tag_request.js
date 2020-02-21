// handle the PUT /reviews/:id/:add-tag request to add a tag to a review

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
const ModelSaver = require(process.env.CS_API_TOP + '/lib/util/restful/model_saver');

class AddTagRequest extends RestfulRequest {

	// authorize the request for the current user
	async authorize () {
		// only a user on the team can add a tag to a review
		const reviewId = this.request.params.id.toLowerCase();
		this.review = await this.data.reviews.getById(reviewId);
		if (!this.review) {
			throw this.errorHandler.error('notFound', { info: 'review' });
		}
		if (!this.user.hasTeam(this.review.get('teamId'))) {
			throw this.errorHandler.error('updateAuth', { reason: 'user must be a member of the team' });
		}
	}

	// process the request...
	async process () {
		await this.requireAndAllow();	// require parameters, and filter out unknown parameters
		await this.getTeam();			// get the team that owns the review
		await this.addTag();			// add the tag
	}

	// require certain parameters, and discard unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['tagId']
				}
			}
		);
	}

	// get the team that owns the review
	async getTeam () {
		this.team = await this.data.teams.getById(this.review.get('teamId'));
		if (!this.team) {
			return this.errorHandler.error('notFound', { info: 'team' });	// shouldn't really happen
		}
	}

	// add the tag to the tags array for this review
	async addTag () {
		// first ensure it's a valid tag for the team
		const tagId = this.request.body.tagId.toLowerCase();
		const teamTags = this.team.get('tags') || {};
		const tag = Object.keys(teamTags).find(id => {
			return id === tagId && !teamTags[tagId].deactivated;
		});
		if (!tag) {
			throw this.errorHandler.error('notFound', { info: 'tag' });
		}

		// make sure this review doesn't already have the tag, or if we're removing,
		// make sure it's not already removed
		if (
			(
				!this.removing && 
				(this.review.get('tags') || []).indexOf(tagId) !== -1 
			) ||
			(
				this.removing &&
				(this.review.get('tags') || []).indexOf(tagId) === -1
			)
		) {
			return;
		}

		// generate an update op for adding the tag
		const now = Date.now();
		const tagOp = this.removing ? '$pull' : '$addToSet';
		const op = { 
			[tagOp]: { 
				tags: tagId
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

	// after the review is updated...
	async postProcess () {
		// send message to the team channel
		const channel = 'team-' + this.review.get('teamId');
		const message = Object.assign({}, this.responseData, { requestId: this.request.id });
		try {
			await this.api.services.broadcaster.publish(
				message,
				channel,
				{ request: this }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate
			this.warn(`Unable to publish review tag message to channel ${channel}: ${JSON.stringify(error)}`);
		}
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'add-review-tag',
			summary: 'Add a tag to a review',
			access: 'User must be a member of the team that owns the review.',
			description: 'Add a tag to a review, specified by tag ID. The tag must be a known tag for the team, according to the ID.',
			input: {
				summary: 'Specify the review ID in the request path, and the tag ID in the request body',
				looksLike: {
					tagId: '<ID of the tag to add>'
				}
			},
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

module.exports = AddTagRequest;
