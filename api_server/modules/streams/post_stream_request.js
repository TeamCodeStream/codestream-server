// handle the POST /posts request to create a new stream

'use strict';

const PostRequest = require(process.env.CS_API_TOP + '/lib/util/restful/post_request');
const StreamPublisher = require('./stream_publisher');

class PostStreamRequest extends PostRequest {

	// authorize the request for the current user
	async authorize () {
		// team ID must be provided, and the user must be a member of the team
		await this.user.authorizeFromTeamId(this.request.body, this, { error: 'createAuth' });
	}

	// after the post is created...
	async postProcess () {
		// publish the stream to the appropriate messager channel
		await new StreamPublisher({
			data: this.responseData,
			stream: this.responseData.stream,
			request: this,
			messager: this.api.services.messager
		}).publishStream();
	}
}

module.exports = PostStreamRequest;
