'use strict';

class Post_Authorizer {

	constructor (options) {
		Object.assign(this, options);
	}

	authorize_post (callback) {
		if (this.post.stream_id) {
			this.authorize_stream(this.post.stream_id, callback);
		}
		else if (typeof this.post.stream === 'object') {
			if (this.post.stream.repo_id) {
				this.authorize_repo(this.post.stream.repo_id, callback);
			}
			else if (this.post.stream.team_id) {
				this.authorize_team(this.post.stream.team_id, callback);
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
			this.request,
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
			this.request,
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
			this.request,
			(error, authorized) => {
				if (error) { return callback(error); }
				if (!authorized) {
					return callback(this.error_handler.error('create_auth', { reason: 'user not on team' }));
				}
				return process.nextTick(callback);
			}
		);
	}
}

module.exports = Post_Authorizer;
