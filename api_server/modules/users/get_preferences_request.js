// handle the "GET /preferences" request to get a user's preferences

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');

class GetPreferencesRequest extends RestfulRequest {

	async authorize () {
		// no authorization needed, the request always applies to the authenticated user
	}

	// process the request...
	async process () {
		// just return the preferences in the response
		this.responseData.preferences = this.request.user.get('preferences') || {};
	}
}

module.exports = GetPreferencesRequest;
