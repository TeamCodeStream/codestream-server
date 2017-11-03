'use strict';

var Post_Request = require(process.env.CS_API_TOP + '/lib/util/restful/post_request');
var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class Post_Repo_Request extends Post_Request {

	authorize (callback) {
		if (!this.request.body.team_id) {
			return callback();
		}
		let team_id = decodeURIComponent(this.request.body.team_id).toLowerCase();
		if (!this.user.has_team(team_id)) {
			return callback(this.error_handler.error('create_auth', { reason: 'user not on team' }));
		}
		return process.nextTick(callback);
	}

	post_process (callback) {
		if (this.response_data.team || this.repo_existed) {
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
		if (!this.response_data.users) {
			return callback();
		}
		Bound_Async.forEachLimit(
			this,
			this.response_data.users,
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
		let team_id = (this.response_data.team && this.response_data.team._id) || this.response_data.repo.team_id;
		let channel = 'user-' + user._id;
		let message = {
			request_id: this.request.id,
			users: [{
				_id: user._id,
				$add: {
					team_ids: team_id
				}
			}]
		};
		this.api.services.messager.publish(
			message,
			channel,
			error => {
				if (error) {
					this.warn(`Could not publish team-add message to user ${user._id}: ${JSON.stringify(error)}`);
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
		let message = Object.assign({}, this.response_data, { request_id: this.request.id });
		let team_id = this.response_data.repo.team_id;
		let channel = 'team-' + team_id;
		this.api.services.messager.publish(
			message,
			channel,
			error => {
				if (error) {
					this.warn(`Could not publish repo message to team ${team_id}: ${JSON.stringify(error)}`);
				}
				// this doesn't break the chain, but it is unfortunate...
				callback();
			}
		);
	}
}

module.exports = Post_Repo_Request;
