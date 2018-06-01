// handle a GET /markers/:id request to fetch a single marker

'use strict';

const GetRequest = require(process.env.CS_API_TOP + '/lib/util/restful/get_request');

class GetMarkerRequest extends GetRequest {

	// describe this route for help
	static describe (module) {
		const description = GetRequest.describe(module);
		description.access = 'User must be a member of the team that owns the file stream to which the marker belongs';
		return description;
	}
}

module.exports = GetMarkerRequest;
