// handle publishing a user object to the team channels for the teams the user belongs to
'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class UserPublisher {

	constructor (options) {
		Object.assign(this, options);
	}

	// publish the user object to each team channel for the teams the user belongs to
	publishUserToTeams (callback) {
		BoundAsync.forEachLimit(
			this,
			this.user.get('teamIds') || [],
			10,
			this.publishUserToTeam,
			callback
		);
	}

	// publish the user object to a particular team channel
	publishUserToTeam (teamId, callback) {
		let message = {
			requestId: this.request.request.id,
			users: [this.data]
		};
		this.messager.publish(
			message,
			'team-' + teamId,
			error => {
				if (error) {
					this.request.warn(`Could not publish user message to team ${teamId}: ${JSON.stringify(error)}`);
				}
				// this doesn't break the chain, but it is unfortunate...
				callback();
			},
			{
				request: this.request
			}
		);
	}
}

module.exports = UserPublisher;
