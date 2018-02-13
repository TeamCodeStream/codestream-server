// handle the POST /posts request to create a new stream

'use strict';

var PostRequest = require(process.env.CS_API_TOP + '/lib/util/restful/post_request');
var StreamPublisher = require('./stream_publisher');

class PostStreamRequest extends PostRequest {

	// authorize the request for the current user
	authorize (callback) {
		// team ID must be provided, and the user must be a member of the team
		this.user.authorizeFromTeamId(this.request.body, this, callback, { error: 'createAuth' });
	}

	// after the post is created...
	postProcess (callback) {
		// publish the stream to the appropriate messager channel
		new StreamPublisher({
			data: this.responseData,
			stream: this.responseData.stream,
			request: this,
			messager: this.api.services.messager
		}).publishStream(callback);
	}
}

module.exports = PostStreamRequest;
