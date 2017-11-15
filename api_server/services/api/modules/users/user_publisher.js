'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class UserPublisher {

	constructor (options) {
		Object.assign(this, options);
	}

	publishUserRegistrationToTeams (callback) {
		BoundAsync.forEachLimit(
			this,
			this.user.teamIds || [],
			10,
			this.publishUserRegistrationToTeam,
			callback
		);
	}

	publishUserRegistrationToTeam (teamId, callback) {
		let message = {
			requestId: this.requestId,
			users: [{
				_id: this.user._id,
				isRegistered: true
			}]
		};
		this.messager.publish(
			message,
			'team-' + teamId,
			error => {
				if (error && this.logger) {
					this.logger.warn(`Could not publish user registration message to team ${teamId}: ${JSON.stringify(error)}`);
				}
				// this doesn't break the chain, but it is unfortunate...
				callback();
			}
		);
	}
}

module.exports = UserPublisher;
