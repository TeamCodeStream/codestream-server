// handle the PUT /posts request to edit attributes of a post

'use strict';

const PutRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/put_request');
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

	// publish the post to the appropriate broadcaster channel
	async publishPost () {
		await new PostPublisher({
			data: this.responseData,
			request: this,
			broadcaster: this.api.services.broadcaster,
			stream: this.updater.stream.attributes
		}).publishPost();
	}

	// describe this route for help
	static describe (module) {
		const description = PutRequest.describe(module);
		description.access = 'Must be the author of the post';
		description.input = {
			summary: description.input,
			looksLike: {
				'text': '<Updated text of the post>',
				'mentionedUserIds': '<Updated array of IDs, representing users mentioned in the post>'
			}
		};
		description.publishes = {
			summary: 'If the post belongs to a file stream or a team stream (a channel with all members of the team), then the post object will be published to the team channel; otherwise it will be published to the stream channel for the stream to which it belongs.',
			looksLike: {
				post: '<@@#post object#post@@>',
			}
		};
		return description;
	}
}

module.exports = PutPostRequest;
