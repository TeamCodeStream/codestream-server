// handle the 'POST /repos' request, to create a repo (or fetch it if it already exists)

'use strict';

var PostRequest = require(process.env.CS_API_TOP + '/lib/util/restful/post_request');
var RepoPublisher = require('./repo_publisher');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

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
		BoundAsync.parallel(this, [
			this.publishRepo,	// publish the repo and any associated team or user data
			this.publishJoinMethodUpdate	// publish a joinMethod update for the user making the request, as needed
		], callback);
	}

	// publish the repo and any associated team or user data
	publishRepo (callback) {
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
			teamWasCreated: !!this.creator.createdTeam,
			repoExisted: this.creator.repoExisted,
			request: this,
			messager: this.api.services.messager
		}).publishRepoData(callback);
	}

	// publish a joinMethod update if the joinMethod attribute was changed for the user as
	// a result of fulfilling this request
	publishJoinMethodUpdate (callback) {
		if (!this.creator.joinMethodUpdate) {
			return callback();	// no joinMethod update to perform
		}
		let channel = 'user-' + this.user.id;
		let message = {
			requestId: this.request.id,
			user: Object.assign({}, this.creator.joinMethodUpdate, { _id: this.user.id })
		};
		this.api.services.messager.publish(
			message,
			channel,
			error => {
				if (error) {
					this.warn(`Could not publish joinMethod update message to user ${this.user._id}: ${JSON.stringify(error)}`);
				}
				// this doesn't break the chain, but it is unfortunate...
				callback();
			},
			{
				request: this
			}
		);
	}
}

module.exports = PostRepoRequest;
