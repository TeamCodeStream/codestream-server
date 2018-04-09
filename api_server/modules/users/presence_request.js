// handle the "PUT /presence" request to announce a particualar user session's
// "presence" status, i.e., online, away, or offline

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request.js');
const SessionManager = require('./session_manager');

class PresenceRequest extends RestfulRequest {

	async authorize () {
		// only applies to current user, no authorization required
	}

	// process the request...
	async process () {
		await this.requireAllow();		// require certain parameters, discard any unknown parameters
		await this.updateSessions();	// update the user's stored session data
	}

	// these parameters are required and/or optional for the request
	async requireAllow () {
		await this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['sessionId', 'status']
				},
				optional: {
					number: ['_awayTimeout']	// overrides configured away timeout value, for testing purposes
				}
			}
		);
	}

	// update session per the given session ID and status
	async updateSessions () {
		this.responseData = {
			// we return the away timeout to the client on every call, so the client
			// can adjust their timer accordingly
			awayTimeout: this.api.config.api.sessionAwayTimeout
		};
		await new SessionManager({
			user: this.user,
			request: this,
			sessionAwayTimeout: this.request.body._awayTimeout
		}).setSessionStatus({
			[this.request.body.sessionId]: { status: this.request.body.status }
		});
	}
}

module.exports = PresenceRequest;
