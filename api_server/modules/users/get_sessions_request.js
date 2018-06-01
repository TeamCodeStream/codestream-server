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

	// describe this route for help
	static describe () {
		return {
			tag: 'sessions',
			summary: 'Gets a user\'s sessions',
			access: 'A user can only access their own sessions',
			description: 'Fetches a user\'s sessions object; the object contains keys that are session IDs (UUIDs established by the client), and values that are objects containing recent session information, usually a presence status and an updatedAt timestamp, indicating the last time the session pinged the server.',
			input: 'No input required or expected',
			returns: {
				summary: 'Returns a sessions object, see the description above',
				looksLike: {
					sessions: '<sessions object>'
				}
			}
		};
	}
}

module.exports = GetSessionsRequest;
