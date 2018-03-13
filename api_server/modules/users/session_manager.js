'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class SessionManager {

	constructor (options) {
		Object.assign(this, options);
	}

	// set status for a particular client session
	setSessionStatus (sessions, callback) {
		this.sessionsToUpdate = sessions;
		this.currentSessions = this.user.get('sessions') || {};
		this.op = {};
		BoundAsync.series(this, [
			this.updateSessions,		// update the sessions data by adding the presence data for this request
			this.removeStaleSessions,	// remove any stale sessions we find, sessions older than the away timeout
			this.saveSessions			// save the sessions data to the server
		], callback);
	}

	// remove any stale sessions we see in the user's session data ... this is any
	// session data with an updatedAt attribute older than the away timeout, as configured
	removeStaleSessions (callback) {
		const now = Date.now();
		const awayTimeout = this.sessionAwayTimeout || this.request.api.config.api.sessionAwayTimeout;
		Object.keys(this.currentSessions).forEach(sessionId => {
			const session = this.currentSessions[sessionId];
			if (session.updatedAt < now - awayTimeout) {
				// set the op to use in the database update, and delete the session
				// info from our current sessions structure
				this.op.$unset = this.op.$unset || {};
				this.op.$unset[`sessions.${sessionId}`] = true;
				delete this.currentSessions[sessionId];
			}
		});
		process.nextTick(callback);
	}

	// update sessions data with the session info passed in
	updateSessions (callback) {
		const now = Date.now();
		Object.keys(this.sessionsToUpdate).forEach(sessionId => {
			this.op.$set = this.op.$set || {};
			this.op.$set[`sessions.${sessionId}`] = Object.assign(
				this.currentSessions[sessionId] || {},
				this.sessionsToUpdate[sessionId],
				{ updatedAt: now }
			);
		});
		process.nextTick(callback);
	}

	// save the modified sessions data to the database
	saveSessions (callback) {
		this.request.data.users.updateDirect(
			{ _id: this.request.data.users.objectIdSafe(this.user.id) },
			this.op,
			callback
		);
	}

	// determine if the given user has an active session, which means a session
	// with status online, and updated since the awayTimeout
	hasActiveSession () {
		const sessions = this.user.get('sessions');
		if (typeof sessions !== 'object') {
			// until we start collection session status, we assume they are online
			// this continues existing email notification behavior if the user has
			// not updated their plugin to the version that tracks presence
			return true;
		}
		return Object.values(sessions).find(session => {
			const now = Date.now();
			const awayTimeout = this.sessionAwayTimeout || this.request.api.config.api.sessionAwayTimeout;
			return (
				session.status === 'online' &&
				session.updatedAt > now - awayTimeout
			);
		});
	}
}

module.exports = SessionManager;
