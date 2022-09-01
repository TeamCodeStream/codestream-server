// handle publishing user objects to the team channel for the team one or more users have been added to
'use strict';

class AddTeamPublisher {

	constructor (options) {
		Object.assign(this, options);
	}

	// publish to a team that new users have been added,
	// and for registered users, publish to them that they've been added to a team
	async publishAddedUsers () {
		const channel = `team-${this.team.id}`;
		const message = {
			requestId: this.request.request.id,
			users: this.users.map(user => user.getSanitizedObject({ request: this.request })),
			team: this.teamUpdate,
		};
		try {
			await this.broadcaster.publish(
				message,
				channel,
				{ request: this.request	}
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.request.warn(`Could not publish user added message to team ${this.team.id}: ${JSON.stringify(error)}`);
		}
	}

}

module.exports = AddTeamPublisher;
