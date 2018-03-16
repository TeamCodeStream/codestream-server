// handle the DELETE /posts request to delete (deactivate) a post

'use strict';

var DeleteRequest = require(process.env.CS_API_TOP + '/lib/util/restful/delete_request');
var PostPublisher = require('./post_publisher');

class DeletePostRequest extends DeleteRequest {

	// authorize the request for the current user
	authorize (callback) {
		// get the post, only the author of the post can edit it
		this.data.posts.getById(
			this.request.params.id,
			(error, post) => {
				if (error) { return callback(error); }
				if (!post) {
					return callback(this.errorHandler.error('notFound', { info: 'post' }));
				}
				if (post.get('creatorId') !== this.user.id) {
					return callback(this.errorHandler.error('deleteAuth', { reason: 'only the post author can delete the post' }));
				}
				this.post = post;
				return callback();
			}
		);
	}

	// after the post is deleted...
	postProcess (callback) {
		this.publishPost(callback);
	}

	// publish the post to the appropriate messager channel
	publishPost (callback) {
		// need the stream for publishing
		this.data.streams.getById(
			this.post.get('streamId'),
			(error, stream) => {
				if (error) { return callback(error); }
				new PostPublisher({
					data: this.responseData,
					request: this,
					messager: this.api.services.messager,
					stream: stream.attributes
				}).publishPost(callback);
			}
		);
	}
}

module.exports = DeletePostRequest;
