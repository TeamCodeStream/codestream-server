// handle publishing a new repo to the broadcaster channel appropriate for the request

'use strict';

const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');

class RepoPublisher {

	constructor (options) {
		Object.assign(this, options);
	}

	// publish the data for a repo, what we publish and where depends on what happened
	// in the request...
	async publishRepoData () {
		await this.publishUserMessages();
		await this.publishTeamMessage();
	}

	// publish the message to each user that has been added to a team
	async publishUserMessages () {
		if (!this.data.users) {
			return;
		}
		await Promise.all(this.data.users.map(async user => {
			await this.publishToUser(user);
		}));
	}

	// publish the repo message to a user
	async publishToUser (user) {
		if (!user.isRegistered) {
			// only registered users get messages
			return;
		}
		let message = DeepClone(this.data);
		message.requestId = this.request.request.id;
		const channel = 'user-' + user.id;
		let currentUser = message.users.find(userInData => user.id === userInData.id);
		if (currentUser !== -1) {
			// explicitly send the directive to add company and team to the user attributes
			// for this user, avoiding race conditions with the arrays
			delete currentUser.companyIds;
			delete currentUser.teamIds;
			currentUser.$addToSet = {
				companyIds: this.team.companyId,
				teamIds: this.team.id
			};
		}
		try {
			await this.broadcaster.publish(
				message,
				channel,
				{ request: this.request }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.request.warn(`Could not publish team-add message to user ${user.id}: ${JSON.stringify(error)}`);
		}
	}

	// publish a message to the team channel for the team that owns the repo,
	// though what that message is depends on the context
	async publishTeamMessage () {
		if (this.teamWasCreated) {
			// this means the team was created on-the-fly when the repo was
			// created ... in this case, every member of the nascent team gets
			// a message, so there is no need for a message here (nobody is
			// listening on the team channel yet)
			return;
		}
		let message = { requestId: this.request.request.id };
		if (this.repoExisted) {
			// if the repo already existed, all we need to do is let the team
			// members that new users have been added to the team
			message.users = this.data.users;
			const newMemberIds = message.users.map(user => user.id);
			message.team = {
				id: this.team.id,
				_id: this.team.id,	// DEPRECATE ME
				$addToSet: { memberIds: newMemberIds }
			};
		}
		else {
			// this is a new repo for an existing team ... send everything we
			// have to the team channel
			Object.assign(message, this.data);
		}
		await this.publishMessageToTeam(message);
	}

	// publish a given message to the team channel for the team that owns the repo
	async publishMessageToTeam (message) {
		const teamId = this.team.id;
		const channel = 'team-' + teamId;
		try {
			await this.broadcaster.publish(
				message,
				channel,
				{ request: this.request	}
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.request.warn(`Could not publish repo message to team ${teamId}: ${JSON.stringify(error)}`);
		}
	}
}

module.exports = RepoPublisher;
