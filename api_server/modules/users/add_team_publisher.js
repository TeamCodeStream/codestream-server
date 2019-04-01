// handle publishing a user object to the team channels for the teams the user belongs to
'use strict';

const RepoIndexes = require(process.env.CS_API_TOP + '/modules/repos/indexes');
const { awaitParallel } = require(process.env.CS_API_TOP + '/server_utils/await_utils');

class AddTeamPublisher {

	constructor (options) {
		Object.assign(this, options);
	}

	// publish to a team that a new user has been added,
	// and for registered users, publish to them that they've been added to a team
	async publishAddedUser () {
		try {
			await awaitParallel([
				this.publishUserToTeam,
				this.publishNewTeamToUser
			], this);
		}
		catch (error) {
			this.request.warn(`Unable to publish added user ${this.user.id}: ${JSON.stringify(error)}`);
		}
	}

	// publish the user object to the team they've been added to
	async publishUserToTeam () {
		const channel = `team-${this.team.id}`;
		const message = {
			requestId: this.request.request.id,
			user: this.user.getSanitizedObject({ request: this.request }),
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
			this.request.warn(`Could not publish user message to team ${this.team.id}: ${JSON.stringify(error)}`);
		}
	}

	// publish to the user that they've been added to a team
	async publishNewTeamToUser () {
		// only publish to registered users
		if (!this.user.get('isRegistered')) {
			return;
		}
		await this.getTeamData();
		await this.sanitizeTeamData();
		await this.publishTeamData();
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
		const memberIds = this.team.get('memberIds') || [];
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
	async publishTeamData () {
		const channel = `user-${this.user.id}`;
		const message = {
			requestId: this.request.request.id,
			user: this.userUpdate
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
			this.request.warn(`Could not publish team-add message to user ${this.user.id}: ${JSON.stringify(error)}`);
		}
	}
}

module.exports = AddTeamPublisher;
