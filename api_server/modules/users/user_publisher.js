// handle publishing a user object to the team channels for the teams the user belongs to
'use strict';

class UserPublisher {

	constructor (options) {
		Object.assign(this, options);
	}

	// publish the user object to each team channel for the teams the user belongs to
	async publishUserToTeams () {
		const teamIds = this.user.get('teamIds') || [];
		await Promise.all(teamIds.map(async teamId => {
			await this.publishUserToTeam(teamId);
		}));
	}

	// publish the user object to a particular team channel
	async publishUserToTeam (teamId) {
		const message = {
			requestId: this.request.request.id,
			users: [this.data]
		};
		try {
			await this.broadcaster.publish(
				message,
				'team-' + teamId,
				{ request: this.request }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.request.warn(`Could not publish user message to team ${teamId}: ${JSON.stringify(error)}`);
		}
	}
}

module.exports = UserPublisher;
