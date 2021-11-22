// handle the PUT /posts request to edit attributes of a post

'use strict';

const PutRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/put_request');
const PostPublisher = require('./post_publisher');

class PutPostRequest extends PutRequest {

	// authorize the request for the current user
	async authorize () {
		// make sure the user has access to the post, note that even though we also check that they
		// are they author of the post (below), they still need to be an active member of the team
		// (they might have been removed, in which case they should no longer be able to edit)
		this.post = await this.user.authorizePost(this.request.params.id, this);
		if (!this.post) {
			throw this.errorHandler.error('updateAuth', { reason: 'the user does not have access to this post' });
		}

		// only the author can actually edit the post
		if (this.post.get('creatorId') !== this.user.id) {
			throw this.errorHandler.error('updateAuth', { reason: 'only the post author can edit the post' });
		}
	}

	// after the post is updated...
	async postProcess () {
		await this.publishPost();
	}

	// publish the post to the appropriate broadcaster channel
	async publishPost () {
		if (!this.post.get('teamId')) { return; }
		await new PostPublisher({
			data: this.responseData,
			request: this,
			broadcaster: this.api.services.broadcaster,
			teamId: this.post.get('teamId')
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
