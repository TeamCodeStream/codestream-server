// handle the "GET /preferences" request to get a user's preferences

'use strict';

var RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');

class GetPreferencesRequest extends RestfulRequest {

	authorize (callback) {
		// no authorization needed, the request always applies to the authenticated user
		return callback();
	}

	// process the request...
	process (callback) {
		// just return the preferences in the response
		this.responseData.preferences = this.request.user.get('preferences') || {};
		callback();
	}
}

module.exports = GetPreferencesRequest;
