// handle publishing a user object to the team channels for the teams the user belongs to
'use strict';

const ArrayUtilities = require(process.env.CS_API_TOP + '/server_utils/array_utilities');
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
		const message = {
			requestId: this.request.request.id,
			user: this.user.getSanitizedObject(),
			team: {
				_id: this.team.id,
				$addToSet: {
					memberIds: this.user.id
				}
			}
		};
		try {
			await this.messager.publish(
				message,
				'team-' + this.team.id,
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
			{
				databaseOptions: {
					hint: RepoIndexes.byTeamId
				}
			}
		);
	}

	// get the member of the team, some or all may be provided by the caller
	async getTeamMembers () {
		const memberIds = this.team.get('memberIds');
		const existingMemberIds = (this.existingMembers || []).map(member => member.id);
		existingMemberIds.push(this.user.id);
		const needMemberIds = ArrayUtilities.difference(memberIds, existingMemberIds);
		if (needMemberIds.length === 0) {
			this.teamMembers = this.existingMembers;
			return;
		}
		const members = await this.request.data.users.getByIds(needMemberIds);
		this.teamMembers = [...this.existingMembers, ...members];
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
		const message = {
			requestId: this.request.request.id,
			user: {
				_id: this.user.id,
				$addToSet: {
					companyIds: this.company.id,
					teamIds: this.team.id
				}
			}
		};
		message.team = this.team.getSanitizedObject();
		message.company = this.company.getSanitizedObject();
		message.users = this.sanitizedTeamMembers;
		message.repos = this.sanitizedRepos;
		try {
			await this.messager.publish(
				message,
				'user-' + this.user.id,
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
