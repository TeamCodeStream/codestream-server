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

		// set defaults for notifications
		if (!this.responseData.preferences.notifications) {
			this.responseData.preferences.notifications = 'involveMe';
		}
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'preferences',
			summary: 'Gets a user\'s preferences',
			access: 'A user can only access their own preferences',
			description: 'Fetches a user\'s preferences object',
			input: 'No input required or expected',
			returns: {
				summary: 'Returns a preferences object, a more-or-less free-form hash of preference values',
				looksLike: {
					preferences: '<preferences object>'
				}
			}
		};
	}
}

module.exports = GetPreferencesRequest;
