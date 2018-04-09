// handle the "GET /users/:id" request, to fetch a given user

'use strict';

const GetRequest = require(process.env.CS_API_TOP + '/lib/util/restful/get_request');

class GetUserRequest extends GetRequest {

	// process the request...
	async process () {
		// allow for specifying "me" as the user to fetch
		if (this.request.params.id.toLowerCase() === 'me') {
			// allow certain "me-attributes" that only this user can see
			this.responseData = { user: this.user.getSanitizedObjectForMe() };
			return;
		}
		await super.process();
	}
}

module.exports = GetUserRequest;
