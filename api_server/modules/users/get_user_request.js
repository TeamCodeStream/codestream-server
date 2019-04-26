// handle the "GET /users/:id" request, to fetch a given user

'use strict';

const GetRequest = require(process.env.CS_API_TOP + '/lib/util/restful/get_request');

class GetUserRequest extends GetRequest {

	// process the request...
	async process () {
		// allow for specifying "me" as the user to fetch
		if (this.request.params.id.toLowerCase() === 'me') {
			// allow certain "me-attributes" that only this user can see
			this.responseData = { user: this.user.getSanitizedObjectForMe({ request: this }) };
			return;
		}
		await super.process();
	}

	// describe this route for help
	static describe (module) {
		const description = GetRequest.describe(module);
		description.access = 'Current user can access the user object for all users across all the teams they are on';
		description.input = 'Specify the ID of the user in the path; the ID can also be \'me\', to fetch the current user\'s own user object';
		return description;
	}
}

module.exports = GetUserRequest;
