'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request.js');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const SessionManager = require('./session_manager');
class PresenceRequest extends RestfulRequest {

	authorize (callback) {
		// only applies to current user, no authorization required
		return callback();
	}

	// process the request...
	process (callback) {
		BoundAsync.series(this, [
			this.requireAllow,
			this.updateSessions
		], callback);
	}

	// these parameters are required and/or optional for the request
	requireAllow (callback) {
		this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['sessionId', 'status']
				},
				optional: {
					number: ['_awayTimeout']	// overrides configured away timeout value, for testing purposes
				}
			},
			callback
		);
	}

	// update session per the given session ID and status
	updateSessions (callback) {
		this.responseData = {
			// we return the away timeout to the client on every call, so the client
			// can adjust their timer accordingly
			awayTimeout: this.api.config.api.sessionAwayTimeout
		};
		new SessionManager({
			user: this.user,
			request: this,
			sessionAwayTimeout: this.request.body._awayTimeout
		}).setSessionStatus({
			[this.request.body.sessionId]: { status: this.request.body.status }
		}, callback);
	}
}

module.exports = PresenceRequest;
