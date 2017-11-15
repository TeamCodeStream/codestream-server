'use strict';

var Post_Request = require(process.env.CS_API_TOP + '/lib/util/restful/post_request');
var Post_Publisher = require('./post_publisher');
var Post_Authorizer = require('./post_authorizer');

class Post_Post_Request extends Post_Request {

	authorize (callback) {
		new Post_Authorizer({
			user: this.user,
			post: this.request.body,
			request: this,
			error_handler: this.error_handler
		}).authorize_post(callback);
	}

	post_process (callback) {
		this.publish_post(callback);
	}

	publish_post (callback) {
		new Post_Publisher({
			data: this.response_data,
			request_id: this.request.id,
			messager: this.api.services.messager,
			stream: this.creator.stream.attributes,
			logger: this
		}).publish_post(callback);
	}
}

module.exports = Post_Post_Request;
