// handle a GET /streams/:id request to fetch a single stream

'use strict';

const GetRequest = require(process.env.CS_API_TOP + '/lib/util/restful/get_request');

class GetStreamRequest extends GetRequest {

	// describe this route for help
	static describe (module) {
		const description = GetRequest.describe(module);
		description.access = 'For streams public to a team, current user must be a member of the team; otherwise for private streams, user must be a member of the stream';
		return description;
	}
}

module.exports = GetStreamRequest;
