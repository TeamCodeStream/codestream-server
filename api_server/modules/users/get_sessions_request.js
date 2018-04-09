// handle the "GET /sessions" request to get a user's sessions

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');

class GetSessionsRequest extends RestfulRequest {

	authorize () {
		// no authorization needed, the request always applies to the authenticated user
	}

	// process the request...
	async process () {
		// return the user's sessions data
		this.responseData.sessions = this.request.user.get('sessions') || {};
	}
}

module.exports = GetSessionsRequest;
