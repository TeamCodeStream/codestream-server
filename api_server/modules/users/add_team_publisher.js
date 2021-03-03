// handle publishing a user object to the team channels for the teams the user belongs to
'use strict';

const RepoIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/repos/indexes');
const { awaitParallel } = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/await_utils');

class AddTeamPublisher {

	constructor (options) {
		Object.assign(this, options);
	}

	// publish to a team that new users have been added,
	// and for registered users, publish to them that they've been added to a team
	async publishAddedUsers () {
		try {
			await this.publishUsersToTeam();
			await this.getTeamData();
			await this.sanitizeTeamData();
			await this.publishNewTeamToEachUser();
		}
		catch (error) {
			this.request.warn(`Unable to publish added users: ${JSON.stringify(error)}`);
		}
	}

	// publish the user object to the team they've been added to
	async publishUsersToTeam () {
		const channel = `team-${this.team.id}`;
		const message = {
			requestId: this.request.request.id,
			users: this.users.map(user => user.getSanitizedObject({ request: this.request })),
			team: this.teamUpdate,
		};
		try {
			await this.broadcaster.publish(
				message,
				channel,
				{ request: this.request	}
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.request.warn(`Could not publish user added message to team ${this.team.id}: ${JSON.stringify(error)}`);
		}
	}

	// publish to each new user that they've been added to a team
	async publishNewTeamToEachUser () {
		await Promise.all(this.users.map(async user => {
			await this.publishNewTeamToUser(user);
		}));
	}

	// publish to the user that they've been added to a team
	async publishNewTeamToUser (user) {
		// only publish to registered users
		if (!user.get('isRegistered')) {
			return;
		}
		return this.publishTeamData(user);
	}

	// get the data that we send to the user when they've been added to a team
	async getTeamData () {
		await awaitParallel([
			this.getTeamRepos,
			this.getTeamMembers,
			this.getCompany
		], this);
	}

	// get the repos associated with a team
	async getTeamRepos () {
		this.repos = await this.request.data.repos.getByQuery(
			{ teamId: this.team.id },
			{ hint: RepoIndexes.byTeamId }
		);
	}

	// get the member of the team, some or all may be provided by the caller
	async getTeamMembers () {
		const memberIds = this.team.getActiveMembers();
		this.teamMembers = await this.request.data.users.getByIds(memberIds);
	}

	// get the company associated with the team, if not provided
	async getCompany () {
		if (this.company) {
			return;
		}
		this.company = await this.request.data.companies.getById(
			this.team.get('companyId')
		);
	}

	// sanitize the team data we need to send with the message
	async sanitizeTeamData () {
		await awaitParallel([
			async () => {
				this.sanitizedRepos =
					await this.request.sanitizeModels(this.repos);
			},
			async () => {
				this.sanitizedTeamMembers =
					await this.request.sanitizeModels(this.teamMembers);
			}
		], this);
	}

	// publish the team data we've collected to the user that has been added
	async publishTeamData (user) {
		const userUpdate = this.userUpdates.find(userUpdate => userUpdate.id === user.id);
		if (!userUpdate) { return; }
		const channel = `user-${user.id}`;
		const message = {
			requestId: this.request.request.id,
			user: userUpdate
		};
		message.team = this.team.getSanitizedObject({ request: this.request });
		message.company = this.company.getSanitizedObject({ request: this.request });
		message.users = this.sanitizedTeamMembers;
		message.repos = this.sanitizedRepos;
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
}

module.exports = AddTeamPublisher;
