'use strict';

var Post_Request = require(process.env.CS_API_TOP + '/lib/util/restful/post_request');
var Stream_Publisher = require('./stream_publisher');

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
		new Stream_Publisher({
			data: this.response_data,
			stream: this.response_data.stream,
			request_id: this.request.id,
			messager: this.api.services.messager
		}).publish_stream(callback);
	}
}

module.exports = Post_Stream_Request;
