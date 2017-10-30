'use strict';

var Post_Request = require(process.env.CS_API_TOP + '/lib/util/restful/post_request');

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
}

module.exports = Post_Repo_Request;
