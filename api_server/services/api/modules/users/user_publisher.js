'use strict';

var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class User_Publisher {

	constructor (options) {
		Object.assign(this, options);
	}

	publish_user_registration_to_teams (callback) {
		Bound_Async.forEachLimit(
			this,
			this.user.team_ids || [],
			10,
			this.publish_user_registration_to_team,
			callback
		);
	}

	publish_user_registration_to_team (team_id, callback) {
		let message = {
			request_id: this.request_id,
			users: [{
				_id: this.user._id,
				is_registered: true
			}]
		};
		this.messager.publish(
			message,
			'team-' + team_id,
			error => {
				if (error) {
					this.warn(`Could not publish user registration message to team ${team_id}: ${JSON.stringify(error)}`);
				}
				// this doesn't break the chain, but it is unfortunate...
				callback();
			}
		);
	}
}

module.exports = User_Publisher;
