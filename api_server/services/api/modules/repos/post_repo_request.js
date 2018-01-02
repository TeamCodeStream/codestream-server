'use strict';

var PostRequest = require(process.env.CS_API_TOP + '/lib/util/restful/post_request');
var RepoPublisher = require('./repo_publisher');

class PostRepoRequest extends PostRequest {

	authorize (callback) {
		if (!this.request.body.teamId) {
			// this is acceptable, we can possibly figure out the team if the repo exists
			return callback();
		}
		this.user.authorizeFromTeamId(this.request.body, this, callback, { error: 'createAuth' });
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
