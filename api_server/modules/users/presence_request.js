// handle the "PUT /presence" request to announce a particualar user session's
// "presence" status, i.e., online, away, or offline

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request.js');
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
			awayTimeout: this.api.config.apiServer.sessionAwayTimeout
		};
		await new SessionManager({
			user: this.user,
			request: this,
			sessionAwayTimeout: this.request.body._awayTimeout
		}).setSessionStatus({
			[this.request.body.sessionId]: { status: this.request.body.status }
		});
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'presence',
			summary: 'Set user\'s presence',
			access: 'Current user can only set presence for themselves.',
			description: 'Set the user\'s presence for a given session to one of: online, away, offline.',
			input: {
				summary: 'Specify parameters in the request body',
				looksLike: {
					'status*': '<The presence status, one of: online, away, offline>',
					'sessionId*': '<The ID of the session, established as a UUID by the client>'
				}
			},
			returns: {
				summary: 'The current configured \'away timeout\', which is how long, in milliseconds, before the user is considered \'away\' for email notification purposes, if there is no activity in a given session.',
				looksLike: {
					awayTimeout: '<Away timeout in ms>'
				}
			}
		};
	}
}

module.exports = PresenceRequest;
