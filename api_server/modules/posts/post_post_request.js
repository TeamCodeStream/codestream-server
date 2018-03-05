// handle the POST /posts request to create a new post

'use strict';

const PostRequest = require(process.env.CS_API_TOP + '/lib/util/restful/post_request');
const PostAuthorizer = require('./post_authorizer');

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
}

module.exports = PostPostRequest;
