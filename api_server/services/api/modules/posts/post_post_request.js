'use strict';

var PostRequest = require(process.env.CS_API_TOP + '/lib/util/restful/post_request');
var PostPublisher = require('./post_publisher');
var PostAuthorizer = require('./post_authorizer');

class PostPostRequest extends PostRequest {

	authorize (callback) {
		new PostAuthorizer({
			user: this.user,
			post: this.request.body,
			request: this,
			errorHandler: this.errorHandler
		}).authorizePost(callback);
	}

	postProcess (callback) {
		this.publishPost(callback);
	}

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
