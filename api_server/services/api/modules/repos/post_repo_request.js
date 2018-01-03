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
		if (this.creator.repoExisted && this.creator.noNewUsers) {
			// if the repo existed and no users were added to the team, there is
			// nothing to publish
			return callback();
		}
		let team = this.responseData.team || this.creator.team.getSanitizedObject();
		new RepoPublisher({
			data: this.responseData,
			team: team,
			teamWasCreated: !!this.responseData.team,
			repoExisted: this.creator.repoExisted,
			requestId: this.request.id,
			messager: this.api.services.messager,
			logger: this
		}).publishRepoData(callback);
	}
}

module.exports = PostRepoRequest;
