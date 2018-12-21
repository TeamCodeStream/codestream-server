// provide a class for handling adding users to a team

'use strict';

const TeamSubscriptionGranter = require('./team_subscription_granter');
const Errors = require('./errors');
const ModelSaver = require(process.env.CS_API_TOP + '/lib/util/restful/model_saver');

class AddTeamMember  {

	constructor (options) {
		Object.assign(this, options);
		['data', 'api', 'errorHandler', 'user', 'transforms'].forEach(x => this[x] = this.request[x]);
		this.errorHandler.add(Errors);
	}

	// main function ... add the indicated members to the team
	async addTeamMember () {
		// short-circuit if the user is already on the team
		if (this.addUser.hasTeam(this.teamId)) {
			return;
		}

		await this.getTeam();					// get the team
		await this.addToTeam();					// add the user to the team
		await this.updateUser();				// update the user indicating they have been added to the team
		await this.grantUserMessagingPermissions();	// grant permission to subscribe to the team channel
	}

	// get the team
	async getTeam () {
		if (this.team) { return; }	// already provided by the caller
		if (!this.teamId) {
			throw this.errorHandler.error('missingArgument', { info: 'teamId'});
		}
		this.team = await this.data.teams.getById(this.teamId);
		if (!this.team) {
			throw this.errorHandler.error('notFound', { info: 'team'});
		}
	}

	// add users to the team by adding IDs to the memberIds array
	async addToTeam () {
		const op = { 
			$addToSet: { 
				memberIds: this.addUser.id 
			},
			$set: {
				modifiedAt: Date.now()
			}
		};
		this.transforms.teamUpdate = await new ModelSaver({
			request: this.request,
			collection: this.data.teams,
			id: this.team.id
		}).save(op);
	}

	// update the user to indicate they are on a new team
	async updateUser () {
		const op = {
			$addToSet: {
				companyIds: this.team.get('companyId'),
				teamIds: this.team.id
			},
			$set: {
				modifiedAt: Date.now()
			}
		};
		// handle the rare case where a registered user isn't on a team yet,
		// and therefore they don't yet have a joinMethod ... we'll update
		// the joinMethod to "Added to Team" here
		if (
			this.addUser.get('isRegistered') && 
			(
				(this.addUser.get('teamIds') || []).length === 0 ||
				!this.addUser.get('joinMethod')
			)
		) {
			Object.assign(op.$set, {
				joinMethod: 'Added to Team',
				primaryReferral: 'internal'
			});
			const creatorId = this.team.get('creatorId');
			const teamCreator = await this.data.users.getById(creatorId);
			if (teamCreator && teamCreator.get('originTeamId')) {
				op.$set.originTeamId = teamCreator.get('originTeamId');
			}
		}

		this.transforms.userUpdate = await new ModelSaver({
			request: this.request,
			collection: this.data.users,
			id: this.addUser.id
		}).save(op);
	}

	// grant permission to the new members to subscribe to the team channel
	async grantUserMessagingPermissions () {
		const granterOptions = {
			data: this.data,
			messager: this.api.services.messager,
			team: this.team,
			members: [this.addUser],
			request: this.request
		};
		try {
			await new TeamSubscriptionGranter(granterOptions).grantToMembers();
		}
		catch (error) {
			throw this.errorHandler.error('teamMessagingGrant', { reason: error });
		}
	}
}

module.exports = AddTeamMember;
