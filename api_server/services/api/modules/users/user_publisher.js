'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class UserPublisher {

	constructor (options) {
		Object.assign(this, options);
	}

	publishUserToTeams (callback) {
		BoundAsync.forEachLimit(
			this,
			this.user.get('teamIds') || [],
			10,
			this.publishUserToTeam,
			callback
		);
	}

	publishUserToTeam (teamId, callback) {
		let userObject = this.user.getSanitizedObject();
		let message = {
			requestId: this.requestId,
			users: [userObject]
		};
		this.messager.publish(
			message,
			'team-' + teamId,
			error => {
				if (error && this.logger) {
					this.logger.warn(`Could not publish user message to team ${teamId}: ${JSON.stringify(error)}`);
				}
				// this doesn't break the chain, but it is unfortunate...
				callback();
			}
		);
	}
}

module.exports = UserPublisher;
