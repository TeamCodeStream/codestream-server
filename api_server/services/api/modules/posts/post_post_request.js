// handle the POST /posts request to create a new post

'use strict';

var PostRequest = require(process.env.CS_API_TOP + '/lib/util/restful/post_request');
var PostPublisher = require('./post_publisher');
var PostAuthorizer = require('./post_authorizer');

class PostPostRequest extends PostRequest {

	// authorize the request for the current user
	authorize (callback) {
		new PostAuthorizer({
			user: this.user,
			post: this.request.body,
			request: this,
			errorHandler: this.errorHandler
		}).authorizePost(callback);
	}

	// after the post is created...
	postProcess (callback) {
		// publish the post on the appropriate messager channel
		this.publishPost(callback);
	}

	// publish the post to the appropriate messager channel 
	publishPost (callback) {
		new PostPublisher({
			data: this.responseData,
			requestId: this.request.id,
			messager: this.api.services.messager,
			stream: this.creator.stream.attributes,
			logger: this
		}).publishPost(callback);
	}
}

module.exports = PostPostRequest;
