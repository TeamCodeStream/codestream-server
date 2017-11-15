'use strict';

var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class Repo_Publisher {

	constructor (options) {
		Object.assign(this, options);
	}

	publish_repo_data (callback) {
		if (this.data.team || this.repo_existed) {
			// if we created a team on the fly, or the repo already existed, in which case we are only concerned
			// with the new users that may have been added to the team
			this.publish_new_team_to_users(callback);
		}
		else {
			// repo added to existing team
			this.publish_repo(callback);
		}
	}

	// in the case of a brand new team created for the repo, we simply publish to each user involved that they
	// are in a new team, it is then up to the clients to fetch information pertaining to the new team
	publish_new_team_to_users (callback) {
		if (!this.data.users) {
			return callback();
		}
		Bound_Async.forEachLimit(
			this,
			this.data.users,
			10,
			this.publish_new_team_to_user,
			callback
		);
	}

	// publish to this user that they are on a new team
	publish_new_team_to_user (user, callback) {
		if (!user.is_registered) {
			// only registered users get messages
			return callback();
		}
		let team_id = (this.data.team && this.data.team._id) || this.data.repo.team_id;
		let channel = 'user-' + user._id;
		let message = {
			request_id: this.request_id,
			users: [{
				_id: user._id,
				$add: {
					team_ids: team_id
				}
			}]
		};
		this.messager.publish(
			message,
			channel,
			error => {
				if (error && this.logger) {
					this.logger.warn(`Could not publish team-add message to user ${user._id}: ${JSON.stringify(error)}`);
				}
				// this doesn't break the chain, but it is unfortunate...
				callback();
			}
		);
	}

	// publish this repo to the team, and message of being added to any users added to the team
	publish_repo (callback) {
		Bound_Async.series(this, [
			this.publish_new_team_to_users,
			this.publish_repo_to_team
		], callback);
	}

	// publish this repo, and any associated baggage, to the team channel
	publish_repo_to_team (callback) {
		let message = Object.assign({}, this.data, { request_id: this.request_id });
		let team_id = this.data.repo.team_id;
		let channel = 'team-' + team_id;
		this.messager.publish(
			message,
			channel,
			error => {
				if (error && this.logger) {
					this.logger.warn(`Could not publish repo message to team ${team_id}: ${JSON.stringify(error)}`);
				}
				// this doesn't break the chain, but it is unfortunate...
				callback();
			}
		);
	}
}

module.exports = Repo_Publisher;
