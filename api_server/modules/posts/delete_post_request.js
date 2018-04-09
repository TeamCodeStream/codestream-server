// handle the DELETE /posts request to delete (deactivate) a post

'use strict';

const DeleteRequest = require(process.env.CS_API_TOP + '/lib/util/restful/delete_request');
const PostPublisher = require('./post_publisher');

class DeletePostRequest extends DeleteRequest {

	// authorize the request for the current user
	async authorize () {
		// get the post, only the author of the post can edit it
		this.post = await this.data.posts.getById(this.request.params.id);
		if (!this.post) {
			throw this.errorHandler.error('notFound', { info: 'post' });
		}
		if (this.post.get('creatorId') !== this.user.id) {
			throw this.errorHandler.error('deleteAuth', { reason: 'only the post author can delete the post' });
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
}

module.exports = DeletePostRequest;
