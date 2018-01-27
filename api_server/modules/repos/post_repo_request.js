// handle the 'POST /repos' request, to create a repo (or fetch it if it already exists) 

'use strict';

var PostRequest = require(process.env.CS_API_TOP + '/lib/util/restful/post_request');
var RepoPublisher = require('./repo_publisher');

class PostRepoRequest extends PostRequest {

	authorize (callback) {
		if (!this.request.body.teamId) {
			// this is acceptable, we can possibly figure out the team if the repo exists
			return callback();
		}
		// otherwise you must be on the team to create a repo for it!
		this.user.authorizeFromTeamId(this.request.body, this, callback, { error: 'createAuth' });
	}

	// after we've processed the request....
	postProcess (callback) {
		if (this.creator.repoExisted && this.creator.noNewUsers) {
			// if the repo existed and no users were added to the team, there is
			// nothing to publish
			return callback();
		}
		// publish a message to the team that owns the repo ... the message will contain the repo
		// if it was actually created (it might have already existed) and/or any users who
		// were added to the team as part of the request
		let team = this.responseData.team || this.creator.team.getSanitizedObject();
		new RepoPublisher({
			data: this.responseData,
			team: team,
			teamWasCreated: !!this.responseData.team,
			repoExisted: this.creator.repoExisted,
			request: this,
			messager: this.api.services.messager
		}).publishRepoData(callback);
	}
}

module.exports = PostRepoRequest;
