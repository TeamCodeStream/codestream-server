// handle the 'POST /repos' request, to create a repo (or fetch it if it already exists)

'use strict';

const PostRequest = require(process.env.CS_API_TOP + '/lib/util/restful/post_request');
const RepoPublisher = require('./repo_publisher');
const { awaitParallel } = require(process.env.CS_API_TOP + '/server_utils/await_utils');

class PostRepoRequest extends PostRequest {

	async authorize () {
		if (!this.request.body.teamId) {
			// this is acceptable, we can possibly figure out the team if the repo exists
			return;
		}
		// otherwise you must be on the team to create a repo for it!
		await this.user.authorizeFromTeamId(this.request.body, this, { error: 'createAuth' });
	}

	// after we've processed the request....
	async postProcess () {
		await awaitParallel([
			this.publishRepo,				// publish the repo and any associated team or user data
			this.publishJoinMethodUpdate	// publish a joinMethod update for the user making the request, as needed
		], this);
	}

	// publish the repo and any associated team or user data
	async publishRepo () {
		if (this.creator.repoExisted && this.creator.noNewUsers) {
			// if the repo existed and no users were added to the team, there is
			// nothing to publish
			return;
		}
		// publish a message to the team that owns the repo ... the message will contain the repo
		// if it was actually created (it might have already existed) and/or any users who
		// were added to the team as part of the request
		const team = this.responseData.team || this.creator.team.getSanitizedObject();
		await new RepoPublisher({
			data: this.responseData,
			team: team,
			teamWasCreated: !!this.creator.createdTeam,
			repoExisted: this.creator.repoExisted,
			request: this,
			messager: this.api.services.messager
		}).publishRepoData();
	}

	// publish a joinMethod update if the joinMethod attribute was changed for the user as
	// a result of fulfilling this request
	async publishJoinMethodUpdate () {
		if (!this.creator.joinMethodUpdate) {
			return;	// no joinMethod update to perform
		}
		const channel = 'user-' + this.user.id;
		const message = {
			requestId: this.request.id,
			user: Object.assign({}, this.creator.joinMethodUpdate, { _id: this.user.id })
		};
		try {
			await this.api.services.messager.publish(
				message,
				channel,
				{ request: this	}
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.warn(`Could not publish joinMethod update message to user ${this.user._id}: ${JSON.stringify(error)}`);
		}
	}
}

module.exports = PostRepoRequest;
