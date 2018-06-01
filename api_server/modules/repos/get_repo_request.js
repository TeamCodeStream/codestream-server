// handle a GET /repos/:id request to fetch a single repo

'use strict';

const GetRequest = require(process.env.CS_API_TOP + '/lib/util/restful/get_request');

class GetRepoRequest extends GetRequest {

	// describe this route for help
	static describe (module) {
		const description = GetRequest.describe(module);
		description.access = 'User must be a member of the team that owns this repo';
		return description;
	}
}

module.exports = GetRepoRequest;
