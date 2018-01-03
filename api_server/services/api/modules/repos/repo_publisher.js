'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var DeepClone = require(process.env.CS_API_TOP + '/lib/util/deep_clone');

class RepoPublisher {

	constructor (options) {
		Object.assign(this, options);
	}

	// publish the data for a repo, what we publish and where depends on what happened
	// in the request...
	publishRepoData (callback) {
		BoundAsync.series(this, [
			this.publishUserMessages,
			this.publishTeamMessage
		], callback);
	}

	// publish the message to each user that has been added to a team
	publishUserMessages (callback) {
		if (!this.data.users) {
			return callback();
		}
		BoundAsync.forEachLimit(
			this,
			this.data.users,
			10,
			this.publishToUser,
			callback
		);
	}

	// publish the repo message to a user
	publishToUser (user, callback) {
		if (!user.isRegistered) {
			// only registered users get messages
			return callback();
		}
		let message = DeepClone(this.data);
		message.requestId = this.requestId;
		let channel = 'user-' + user._id;
		let currentUser = message.users.find(userInData => user._id === userInData._id);
		if (currentUser !== -1) {
			// explicitly send the directive to add company and team to the user attributes
			// for this user, avoiding race conditions with the arrays
			delete currentUser.companyIds;
			delete currentUser.teamIds;
			currentUser.$addToSet = {
				companyIds: this.team.companyId,
				teamIds: this.team._id
			};
		}
		this.messager.publish(
			message,
			channel,
			error => {
				if (error && this.logger) {
					this.logger.warn(`Could not publish team-add message to user ${user._id}: ${JSON.stringify(error)}`);
				}
				// this doesn't break the chain, but it is unfortunate...
				callback();
			}
		);
	}

	// publish a message to the team channel for the team that owns the repo,
	// though what that message is depends on the context
	publishTeamMessage (callback) {
		if (this.teamWasCreated) {
			// this means the team was created on-the-fly when the repo was
			// created ... in this case, every member of the nascent team gets
			// a message, so there is no need for a message here (nobody is
			// listening on the team channel yet)
			return callback();
		}
		let message = { requestId: this.requestId };
		if (this.repoExisted) {
			// if the repo already existed, all we need to do is let the team
			// members that new users have been added to the team
			message.users = this.data.users;
			let newMemberIds = message.users.map(user => user._id);
			message.team = {
				_id: this.team._id,
				$addToSet: { memberIds: newMemberIds }
			};
		}
		else {
			// this is a new repo for an existing team ... send everything we
			// have to the team channel
			Object.assign(message, this.data);
		}
		this.publishMessageToTeam(message, callback);
	}

	// publish a given message to the team channel for the team that owns the repo
	publishMessageToTeam (message, callback) {
		let teamId = this.team._id;
		let channel = 'team-' + teamId;
		this.messager.publish(
			message,
			channel,
			error => {
				if (error && this.logger) {
					this.logger.warn(`Could not publish repo message to team ${teamId}: ${JSON.stringify(error)}`);
				}
				// this doesn't break the chain, but it is unfortunate...
				callback();
			}
		);
	}
}

module.exports = RepoPublisher;
