'use strict';

var Post_Request = require(process.env.CS_API_TOP + '/lib/util/restful/post_request');
var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class Post_Stream_Request extends Post_Request {

	authorize (callback) {
		if (!this.request.body.team_id) {
			return callback(this.error_handler.error('attribute_required', { info: 'team_id' }));
		}
		let team_id = decodeURIComponent(this.request.body.team_id).toLowerCase();
		this.user.authorize_team(
			team_id,
			this,
			(error, authorized) => {
				if (error) { return callback(error); }
				if (!authorized) {
					return callback(this.error_handler.error('create_auth', { reason: 'user not on team' }));
				}
				return process.nextTick(callback);
			}
		);
	}

	post_process (callback) {
		if (this.response_data.stream.type === 'file') {
			this.publish_new_stream_to_team(callback);
		}
		else {
			this.publish_new_stream_to_members(callback);
		}
	}

	// publish a new file-type stream to the team that owns it
	publish_new_stream_to_team (callback) {
		let team_id = this.response_data.stream.team_id;
		let channel = 'team-' + team_id;
		let message = Object.assign({}, this.response_data, { request_id: this.request.id });
		this.api.services.messager.publish(
			message,
			channel,
			error => {
				if (error) {
					this.warn(`Could not publish new stream message to team ${team_id}: ${JSON.stringify(error)}`);
				}
				// this doesn't break the chain, but it is unfortunate...
				callback();
			}
		);
	}

	// publish a new channel or direct type stream to its members
	publish_new_stream_to_members (callback) {
		Bound_Async.forEachLimit(
			this,
			this.response_data.stream.member_ids,
			10,
			this.publish_new_stream_to_user,
			callback
		);
	}

	// publish a new channel or direct type stream to one of its members
	publish_new_stream_to_user (user_id, callback) {
		let channel = 'user-' + user_id;
		let message = Object.assign({}, this.response_data, { request_id: this.request.id });
		this.api.services.messager.publish(
			message,
			channel,
			error => {
				if (error) {
					this.warn(`Could not publish new stream message to user ${user_id}: ${JSON.stringify(error)}`);
				}
				// this doesn't break the chain, but it is unfortunate...
				callback();
			}
		);
	}
}

module.exports = Post_Stream_Request;
