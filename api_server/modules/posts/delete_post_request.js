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

	// after the post is deleted...
	async postProcess () {
		await this.publishPost();
	}

	// publish the post to the appropriate messager channel
	async publishPost () {
		// need the stream for publishing
		const stream = await this.data.streams.getById(this.post.get('streamId'));
		await new PostPublisher({
			data: this.responseData,
			request: this,
			messager: this.api.services.messager,
			stream: stream.attributes
		}).publishPost();
	}

	// describe this route for help
	static describe (module) {
		const description = DeleteRequest.describe(module);
		description.access = 'Must be the author of the post';
		description.returns = {
			summary: 'Returns the post with a directive to set deactivated flag to true',
			looksLike: {
				post: {
					_id: '<ID of the post>',
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
					_id: '<ID of the post>',
					$set: {
						deactivated: true
					}
				}
			}
		};
		description.errors.push('validation');
		return description;
	}
}

module.exports = DeletePostRequest;
