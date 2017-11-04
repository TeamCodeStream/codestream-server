'use strict';

var Post_Request = require(process.env.CS_API_TOP + '/lib/util/restful/post_request');
var Post_Publisher = require('./post_publisher');

class Post_Post_Request extends Post_Request {

	authorize (callback) {
		if (this.request.body.stream_id) {
			this.authorize_stream(this.request.body.stream_id, callback);
		}
		else if (typeof this.request.body.stream === 'object') {
			if (this.request.body.stream.repo_id) {
				this.authorize_repo(this.request.body.stream.repo_id, callback);
			}
			else if (this.request.body.stream.team_id) {
				this.authorize_team(this.request.body.stream.team_id, callback);
			}
			else {
				return callback(this.error_handler.error('attribute_required', { info: 'team_id' }));
			}
		}
		else {
			return callback(this.error_handler.error('attribute_required', { info: 'stream_id' }));
		}
	}

	authorize_stream (stream_id, callback) {
		this.user.authorize_stream(
			stream_id,
			this,
			(error, authorized) => {
				if (error) { return callback(error); }
				if (!authorized) {
					return callback(this.error_handler.error('create_auth', { reason: 'not authorized for stream' }));
				}
				return process.nextTick(callback);
			}
		);
	}

	authorize_repo (repo_id, callback) {
		this.user.authorize_repo(
			repo_id,
			this,
			(error, authorized) => {
				if (error) { return callback(error); }
				if (!authorized) {
					return callback(this.error_handler.error('create_auth', { reason: 'not authorized for repo' }));
				}
				return process.nextTick(callback);
			}
		);
	}

	authorize_team (team_id, callback) {
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
		this.publish_post(callback);
	}

	publish_post (callback) {
		new Post_Publisher({
			data: this.response_data,
			request_id: this.request.id,
			messager: this.api.services.messager,
			stream: this.creator.stream.attributes
		}).publish_post(callback);
	}
}

module.exports = Post_Post_Request;
