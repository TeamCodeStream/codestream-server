// handle a GET /teams/:id request to fetch a single team

'use strict';

const GetRequest = require(process.env.CS_API_TOP + '/lib/util/restful/get_request');

class GetTeamRequest extends GetRequest {

	// describe this route for help
	static describe (module) {
		const description = GetRequest.describe(module);
		description.access = 'User must be a member of the team';
		return description;
	}
}

module.exports = GetTeamRequest;
