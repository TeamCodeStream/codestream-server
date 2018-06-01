// handle a GET /posts/:id request to fetch a single post

'use strict';

const GetRequest = require(process.env.CS_API_TOP + '/lib/util/restful/get_request');

class GetPostRequest extends GetRequest {

	// describe this route for help
	static describe (module) {
		const description = GetRequest.describe(module);
		description.access = 'For posts in a file stream, user must be a member of the team that owns the file stream; for other streams, user must be a member of the stream';
		return description;
	}
}

module.exports = GetPostRequest;
