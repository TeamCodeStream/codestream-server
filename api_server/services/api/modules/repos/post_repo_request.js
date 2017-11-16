'use strict';

var PostRequest = require(process.env.CS_API_TOP + '/lib/util/restful/post_request');
var RepoPublisher = require('./repo_publisher');

class PostRepoRequest extends PostRequest {

	authorize (callback) {
		if (!this.request.body.teamId) {
			return callback();
		}
		let teamId = decodeURIComponent(this.request.body.teamId).toLowerCase();
		if (!this.user.hasTeam(teamId)) {
			return callback(this.errorHandler.error('createAuth', { reason: 'user not on team' }));
		}
		return process.nextTick(callback);
	}

	postProcess (callback) {
		new RepoPublisher({
			data: this.responseData,
			repoExisted: this.creator.repoExisted,
			requestId: this.request.id,
			messager: this.api.services.messager,
			logger: this
		}).publishRepoData(callback);
	}
}

module.exports = PostRepoRequest;
