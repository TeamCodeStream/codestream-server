'use strict';

var RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');

class GetSessionsRequest extends RestfulRequest {

	authorize (callback) {
		// no authorization needed, the request always applies to the authenticated user
		return callback();
	}

	// process the request...
	process (callback) {
		// return the user's sessions data
		this.responseData.sessions = this.request.user.get('sessions') || {};
		callback();
	}
}

module.exports = GetSessionsRequest;
