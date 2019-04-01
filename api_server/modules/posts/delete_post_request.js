// handle the DELETE /posts request to delete (deactivate) a post

'use strict';

const DeleteRequest = require(process.env.CS_API_TOP + '/lib/util/restful/delete_request');
const PostPublisher = require('./post_publisher');

class DeletePostRequest extends DeleteRequest {

	// authorize the request for the current user
	async authorize () {
		// get the post, only the author of the post or the team admin can edit it
		this.post = await this.data.posts.getById(this.request.params.id);
		if (!this.post) {
			throw this.errorHandler.error('notFound', { info: 'post' });
		}
		this.team = await this.data.teams.getById(this.post.get('teamId'));
		if (!this.team) {
			throw this.errorHandler.error('notFound', { info: 'team' });	// really shouldn't happen
		}
		if (
			this.post.get('creatorId') !== this.user.id &&
			!(this.team.get('adminIds') || []).includes(this.user.id)
		) {
			throw this.errorHandler.error('deleteAuth', { reason: 'only the post author or a team admin can delete the post' });
		}
	}

	async handleResponse () {
		if (this.gotError) {
			return super.handleResponse();
		}

		// put the deleted post into posts instead
		this.responseData.posts = [this.responseData.post];
		delete this.responseData.post;

		// add any deleted codemark to the response
		if (this.transforms.deletedCodemark) {
			this.responseData.codemarks = this.responseData.codemarks || [];
			this.responseData.codemarks.push(this.transforms.deletedCodemark);
		}

		// add any deleted markers to the response
		if (this.transforms.deletedMarkers) {
			this.responseData.markers = this.transforms.deletedMarkers;
		}
		
		// if a parent post was updated, add that to the response
		if (this.transforms.updatedParentCodemark) {
			this.responseData.codemarks = this.responseData.codemarks || [];
			this.responseData.codemarks.push(this.transforms.updatedParentCodemark);
		}

		// if a parent post has a codemark that was updated, add that to the response
		if (this.transforms.updatedParentPost) {
			this.responseData.posts.push(this.transforms.updatedParentPost);
		}
		
		await super.handleResponse();
	}

	// after the post is deleted...
	async postProcess () {
		// need the stream for publishing
		this.stream = await this.data.streams.getById(this.post.get('streamId'));
		await this.publishPost();
		await this.publishMarkers();
	}

	// publish the post to the appropriate broadcaster channel
	async publishPost () {
		await new PostPublisher({
			data: this.responseData,
			request: this,
			broadcaster: this.api.services.broadcaster,
			stream: this.stream.attributes
		}).publishPost();
	}

	// deleted markers always go out to the team channel, even if they are in a private stream
	async publishMarkers () {
		if (!this.responseData.markers || this.stream.get('isTeamStream')) {
			return;
		}
		const message = {
			markers: this.responseData.markers,
			requestId: this.request.id
		};
		const channel = `team-${this.team.id}`;
		try {
			await this.api.services.broadcaster.publish(
				message,
				channel,
				{ request: this.request }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.warn(`Could not publish markers message to channel ${channel}: ${JSON.stringify(error)}`);
		}
	}

	// describe this route for help
	static describe (module) {
		const description = DeleteRequest.describe(module);
		description.access = 'Must be the author of the post, or an admin';
		description.returns = {
			summary: 'Returns the post with a directive to set deactivated flag to true',
			looksLike: {
				post: {
					id: '<ID of the post>',
					$set: {
						deactivated: true
					}
				}
			}
		};
		description.publishes = {
			summary: 'If the post belongs to a file stream or a team stream (a channel with all members of the team), then the post object will be published to the team channel; otherwise it will be published to the stream channel for the stream to which it belongs.',
			looksLike: {
				post: {
					id: '<ID of the post>',
					$set: {
						deactivated: true
					}
				}
			}
		};
		description.errors.push('alreadyDeleted');
		return description;
	}
}

module.exports = DeletePostRequest;
