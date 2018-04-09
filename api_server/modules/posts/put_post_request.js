// handle the PUT /posts request to edit attributes of a post

'use strict';

const PutRequest = require(process.env.CS_API_TOP + '/lib/util/restful/put_request');
const PostPublisher = require('./post_publisher');

class PutPostRequest extends PutRequest {

	// authorize the request for the current user
	async authorize () {
		// get the post, only the author of the post can edit it
		const post = await this.data.posts.getById(this.request.params.id);
		if (!post) {
			throw this.errorHandler.error('notFound', { info: 'post' });
		}
		if (post.get('creatorId') !== this.user.id) {
			throw this.errorHandler.error('updateAuth', { reason: 'only the post author can edit the post' });
		}
	}

	// after the post is updated...
	async postProcess () {
		await this.publishPost();
	}

	// publish the post to the appropriate messager channel
	async publishPost () {
		await new PostPublisher({
			data: this.responseData,
			request: this,
			messager: this.api.services.messager,
			stream: this.updater.stream.attributes
		}).publishPost();
	}
}

module.exports = PutPostRequest;
