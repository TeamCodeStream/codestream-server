'use strict';

var Post_Request = require(process.env.CS_API_TOP + '/lib/util/restful/post_request');
var Repo_Publisher = require('./repo_publisher');

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
		new Repo_Publisher({
			data: this.response_data,
			repo_existed: this.creator.repo_existed,
			request_id: this.request.id,
			messager: this.api.services.messager
		}).publish_repo_data(callback);
	}
}

module.exports = Post_Repo_Request;
