'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class RepoPublisher {

	constructor (options) {
		Object.assign(this, options);
	}

	publishRepoData (callback) {
		if (this.data.team || this.repoExisted) {
			// if we created a team on the fly, or the repo already existed, in which case we are only concerned
			// with the new users that may have been added to the team
			this.publishNewTeamToUsers(callback);
		}
		else {
			// repo added to existing team
			this.publishRepo(callback);
		}
	}

	// in the case of a brand new team created for the repo, we simply publish to each user involved that they
	// are in a new team, it is then up to the clients to fetch information pertaining to the new team
	publishNewTeamToUsers (callback) {
		if (!this.data.users) {
			return callback();
		}
		BoundAsync.forEachLimit(
			this,
			this.data.users,
			10,
			this.publishNewTeamToUser,
			callback
		);
	}

	// publish to this user that they are on a new team
	publishNewTeamToUser (user, callback) {
		if (!user.isRegistered) {
			// only registered users get messages
			return callback();
		}
		let teamId = (this.data.team && this.data.team._id) || this.data.repo.teamId;
		let channel = 'user-' + user._id;
		let message = {
			requestId: this.requestId,
			users: [{
				_id: user._id,
				'$addToSet': {
					teamIds: teamId
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
	publishRepo (callback) {
		BoundAsync.series(this, [
			this.publishNewTeamToUsers,
			this.publishRepoToTeam
		], callback);
	}

	// publish this repo, and any associated baggage, to the team channel
	publishRepoToTeam (callback) {
		let message = Object.assign({}, this.data, { requestId: this.requestId });
		let teamId = this.data.repo.teamId;
		let channel = 'team-' + teamId;
		this.messager.publish(
			message,
			channel,
			error => {
				if (error && this.logger) {
					this.logger.warn(`Could not publish repo message to team ${teamId}: ${JSON.stringify(error)}`);
				}
				// this doesn't break the chain, but it is unfortunate...
				callback();
			}
		);
	}
}

module.exports = RepoPublisher;
