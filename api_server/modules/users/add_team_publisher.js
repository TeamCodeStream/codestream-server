// handle publishing a user object to the team channels for the teams the user belongs to
'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const ArrayUtilities = require(process.env.CS_API_TOP + '/server_utils/array_utilities');
const RepoIndexes = require(process.env.CS_API_TOP + '/modules/repos/indexes');

class AddTeamPublisher {

	constructor (options) {
		Object.assign(this, options);
	}

	// publish to a team that a new user has been added,
	// and for registered users, publish to them that they've been added to a team
	publishAddedUser (callback) {
		BoundAsync.parallel(this, [
			this.publishUserToTeam,
			this.publishNewTeamToUser
		], error => {
			if (error) {
				this.request.warn(`Unable to publish added user ${this.user.id}: ${JSON.stringify(error)}`);
			}
			callback();
		});
	}

	// publish the user object to the team they've been added to
	publishUserToTeam (callback) {
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
		this.messager.publish(
			message,
			'team-' + this.team.id,
			error => {
				if (error) {
					this.request.warn(`Could not publish user message to team ${this.team.id}: ${JSON.stringify(error)}`);
				}
				// this doesn't break the chain, but it is unfortunate...
				callback();
			},
			{
				request: this.request
			}
		);
	}

	// publish to the user that they've been added to a team
	publishNewTeamToUser (callback) {
		BoundAsync.series(this, [
			this.getTeamData,
			this.sanitizeTeamData,
			this.publishTeamData
		], callback);
	}

	// get the data that we send to the user when they've been added to a team
	getTeamData (callback) {
		BoundAsync.parallel(this, [
			this.getTeamRepos,
			this.getTeamMembers,
			this.getCompany
		], callback);
	}

	// get the repos associated with a team
	getTeamRepos (callback) {
		this.request.data.repos.getByQuery(
			{ teamId: this.team.id },
			(error, repos) => {
				if (error) { return callback(error); }
				this.repos = repos;
				callback();
			},
			{
				databaseOptions: {
					hint: RepoIndexes.byTeamId
				}
			}
		);
	}

	// get the member of the team, some or all may be provided by the caller
	getTeamMembers (callback) {
		const memberIds = this.team.get('memberIds');
		const existingMemberIds = (this.existingMembers || []).map(member => member.id);
		existingMemberIds.push(this.user.id);
		const needMemberIds = ArrayUtilities.difference(memberIds, existingMemberIds);
		if (needMemberIds.length === 0) {
			this.teamMembers = this.existingMembers;
			return process.nextTick(callback);
		}
		this.request.data.users.getByIds(
			needMemberIds,
			(error, members) => {
				if (error) { return callback(error); }
				this.teamMembers = [...this.existingMembers, ...members];
				callback();
			}
		);
	}

	// get the company associated with the team, if not provided
	getCompany (callback) {
		if (this.company) {
			return callback();
		}
		this.request.data.companies.getById(
			this.team.get('companyId'),
			(error, company) => {
				if (error) { return callback(error); }
				this.company = company;
				callback();
			}
		);
	}

	// sanitize the team data we need to send with the message
	sanitizeTeamData (callback) {
		BoundAsync.parallel(this, [
			parallelCallback => {
				this.request.sanitizeModels(this.repos, parallelCallback);
			},
			parallelCallback => {
				this.request.sanitizeModels(this.teamMembers, parallelCallback);
			}
		], (error, results) => {
			this.sanitizedRepos = results[0];
			this.sanitizedTeamMembers = results[1];
			process.nextTick(callback);
		});
	}

	// publish the team data we've collected to the user that has been added
	publishTeamData (callback) {
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
		this.messager.publish(
			message,
			'user-' + this.user.id,
			error => {
				if (error) {
					this.request.warn(`Could not publish team-add message to user ${this.user.id}: ${JSON.stringify(error)}`);
				}
				// this doesn't break the chain, but it is unfortunate...
				callback();
			},
			{
				request: this.request
			}
		);
	}
}

module.exports = AddTeamPublisher;
