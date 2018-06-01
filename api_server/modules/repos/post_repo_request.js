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

	// describe this route for help
	static describe (module) {
		const description = PostRequest.describe(module);
		description.description = 'Creates a repo record associated with a repo given by URL, or finds the matching repo to the given URL. Can also create a team on-the-fly to own the repo.';
		description.access = 'If associating the repo with an existing team, the user must be a member of the team.';
		description.input = {
			summary: description.input,
			looksLike: {
				'url*': '<The URL of the repo>',
				'teamId': '<ID of the team to own the repo created, if not provided, then a team object must be provided>',
				'firstCommitHash': '<First commit SHA in the repo\'s commit history (deprecated in favor of knownCommitHashes)>',
				'knownCommitHashes': '<Multiple commit SHAs in the repo\'s commit history, used to validate access to the repo by other users>',
				'team': '<Minimal @@#team object#team@@, for creating a team on-the-fly with the repo>',
				'emails': '<Array of emails representing users to be added to the team that will own the repo>',
				'users': '<Array of @@#user objects#user@@, representing users to be added to the team that will own the repo>'
			}
		};
		description.returns.summary = 'A repo object, plus a team object if a team was created on-the-fly, and user objects if any users were added to the team created on-the-fly';
		Object.assign(description.returns.looksLike, {
			team: '<@@#team object#team@@ > (if team created on-the-fly for the repo)>',
			company: '<@@#company object#company@@ > (if team created on-the-fly for the repo, company is also created)>',
			streams: '<array of @@#stream objects#stream@@, representing the team-streams associated with the team that owns the repo, only if the user is joining the team that owns the repo>',
			users: [
				'<@@#user object#user@@ > (if users added to the team created on-the-fly, or if the user is joining a team, all users on the team)>',
				'...'
			]
		});
		description.publishes = {
			summary: 'If the repo was added to an existing team, will publish the repo object to the team channel',
			looksLike: {
				repo: '<@@#repo object#repo@@>'
			}
		};
		description.errors.push('shaMismatch');
		return description;
	}
}

module.exports = PostRepoRequest;
