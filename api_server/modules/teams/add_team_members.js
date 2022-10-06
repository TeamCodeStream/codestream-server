// provide a class for handling adding users to a team

'use strict';

const TeamSubscriptionGranter = require('./team_subscription_granter');
const Errors = require('./errors');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');

class AddTeamMembers  {

	constructor (options) {
		Object.assign(this, options);
		['data', 'api', 'errorHandler', 'user', 'transforms'].forEach(x => this[x] = this.request[x]);
		this.errorHandler.add(Errors);
	}

	// main function ... add the indicated members to the team
	async addTeamMembers () {
		await this.getTeam();					// get the team
		await this.addToTeam();					// add the users to the team
		await this.updateUsers();				// update the users indicating they have been added to the team
		await this.grantUserMessagingPermissions();	// grant all users permission to subscribe to the team channel
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
		const addedMemberIds = this.addUsers.map(user => user.id);
		const op = { 
			$addToSet: { 
				memberIds: addedMemberIds
			},
			$pull: {
				removedMemberIds: addedMemberIds,
				foreignMemberIds: addedMemberIds
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

	// update the users to indicate they are on a new team
	async updateUsers () {
		this.transforms.userUpdates = [];
		await Promise.all(this.addUsers.map(async user => {
			await this.updateUser(user);
		}));
	}

	// update the given user to indicate they are on a new team
	async updateUser (user) {
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
		//
		// OR: the user is joining a team (based on domain-based joining)
		if (
			user.get('isRegistered') && 
			(
				(user.get('teamIds') || []).length === 0 ||
				!user.get('joinMethod')
			)
		) {
			Object.assign(op.$set, {
				joinMethod: this.joinMethod || 'Added to Team',
				primaryReferral: this.joinMethod ? 'external' : 'internal'
			});
			if (!this.joinMethod) {
				// this only gets set when a user is invited
				const creatorId = this.team.get('creatorId');
				const teamCreator = await this.data.users.getById(creatorId);
				if (teamCreator && teamCreator.get('originTeamId')) {
					op.$set.originTeamId = teamCreator.get('originTeamId');
				}
			}
		}

		const userUpdate = await new ModelSaver({
			request: this.request,
			collection: this.data.users,
			id: user.id
		}).save(op);
		this.transforms.userUpdates.push(userUpdate);
	}

	// grant permission to the new members to subscribe to the team channel
	async grantUserMessagingPermissions () {
		const granterOptions = {
			data: this.data,
			broadcaster: this.api.services.broadcaster,
			team: this.team,
			members: this.addUsers,
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

module.exports = AddTeamMembers;
