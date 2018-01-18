// handle the PUT /posts request to edit attributes of a post

'use strict';

var PutRequest = require(process.env.CS_API_TOP + '/lib/util/restful/put_request');
var PostPublisher = require('./post_publisher');

class PutPostRequest extends PutRequest {

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
                    return callback(this.errorHandler.error('updateAuth', { reason: 'only the post author can edit the post' }));
                }
                return callback();
            }
        );
	}

	// after the post is updated...
	postProcess (callback) {
        this.publishPost(callback);
	}

	// publish the post to the appropriate messager channel
	publishPost (callback) {
		new PostPublisher({
			data: this.responseData,
			request: this,
			messager: this.api.services.messager,
			stream: this.updater.stream.attributes
		}).publishPost(callback);
	}
}

module.exports = PutPostRequest;
