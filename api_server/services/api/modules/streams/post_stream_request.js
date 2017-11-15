'use strict';

var PostRequest = require(process.env.CS_API_TOP + '/lib/util/restful/post_request');
var StreamPublisher = require('./stream_publisher');

class PostStreamRequest extends PostRequest {

	authorize (callback) {
		if (!this.request.body.teamId) {
			return callback(this.errorHandler.error('attributeRequired', { info: 'teamId' }));
		}
		let teamId = decodeURIComponent(this.request.body.teamId).toLowerCase();
		this.user.authorizeTeam(
			teamId,
			this,
			(error, authorized) => {
				if (error) { return callback(error); }
				if (!authorized) {
					return callback(this.errorHandler.error('createAuth', { reason: 'user not on team' }));
				}
				return process.nextTick(callback);
			}
		);
	}

	postProcess (callback) {
		new StreamPublisher({
			data: this.responseData,
			stream: this.responseData.stream,
			requestId: this.request.id,
			messager: this.api.services.messager,
			logger: this
		}).publishStream(callback);
	}
}

module.exports = PostStreamRequest;
