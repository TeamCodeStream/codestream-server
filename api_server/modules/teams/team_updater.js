// this class should be used to update team documents in the database

'use strict';

const ModelUpdater = require(process.env.CS_API_TOP + '/lib/util/restful/model_updater');
const Team = require('./team');
const ArrayUtilities = require(process.env.CS_API_TOP + '/server_utils/array_utilities');

class TeamUpdater extends ModelUpdater {

	get modelClass () {
		return Team;	// class to use to create a team model
	}

	get collectionName () {
		return 'teams';	// data collection to use
	}

	// convenience wrapper
	async updateTeam (id, attributes) {
		return await this.updateModel(id, attributes);
	}

	// get attributes that are allowed, we will ignore all others
	getAllowedAttributes () {
		return {
			string: ['name'],
			object: ['$addToSet', '$push', '$pull']
		};
	}

	// validate the input attributes
	validateAttributes () {
		// look for directives applied to memberIds or adminIds, we only allow a single directive at once
		let finalDirective = null;
		for (let directive of ['$push', '$pull', '$addToSet']) {
			const directiveTarget = this.attributes[directive];
			delete this.attributes[directive];	// essentially remove any non-matching directives 
			for (let attribute of ['memberIds', 'adminIds']) {
				if (directiveTarget && directiveTarget[attribute]) {
					if (finalDirective) {
						return 'can only update one ID array at once and with a single directive';
					}
					if (directive === '$push') {
						// substitute $addToSet for $push, tolerating the looser $push as synonymous
						directive = '$addToSet';
					}
					if (directive === '$addToSet' && attribute === 'memberIds') {
						// POST /users is the proper way to add a user to the team
						return 'can not add users directly to the team, use POST /users with email';
					}
					// the value can be a single ID or an array, if a single ID, turn it into an array
					let value = directiveTarget[attribute];
					if (typeof value === 'string') {
						value = [value];
					}
					else if (!(value instanceof Array)) {
						return `${attribute} must be a  array`;
					}
					finalDirective = {
						[directive]: { [attribute]: value }
					};
				}
			}
		}
		if (finalDirective) {
			Object.assign(this.attributes, finalDirective);
			if (
				finalDirective.$pull &&
				finalDirective.$pull.memberIds && 
				finalDirective.$pull.memberIds.includes(this.user.id)
			) {
				return 'can not remove yourself as a member of the team';
			}
			if (
				finalDirective.$pull &&
				finalDirective.$pull.memberIds
			) {
				// if removing users from the team, also remove them as admins
				finalDirective.$pull.adminIds = finalDirective.$pull.memberIds;
			}
		}
	}

	// before the team info gets saved...
	async preSave () {
		await this.getTeam();
		await this.getUsers();
		await this.removeUsersFromTeam();
		this.attributes.modifiedAt = Date.now();
		await super.preSave();
	}
	
	// get the team needed for update
	async getTeam () {
		this.team = await this.request.data.teams.getById(this.id);
		if (!this.team) {
			throw this.errorHandler.error('notFound', { info: 'team' });
		}
	}

	// confirm that the IDs for the users being added or removed are valid
	async getUsers () {
		let memberIds = (
			this.attributes.$addToSet && 
			this.attributes.$addToSet.adminIds
		) || (
			this.attributes.$pull && 
			this.attributes.$pull.adminIds
		) || (
			this.attributes.$pull &&
			this.attributes.$pull.memberIds
		) || [];
		if (memberIds.length === 0) {
			return;
		}

		// only admins can perform these operations
		if (!(this.team.get('adminIds') || []).includes(this.user.id)) {
			throw this.errorHandler.error('adminsOnly');
		}

		// all users must actually exist
		const users = await this.request.data.users.getByIds(memberIds);
		const foundMemberIds = users.map(user => user.id);
		const notFoundMemberIds = ArrayUtilities.difference(memberIds, foundMemberIds);
		if (notFoundMemberIds.length > 0) {
			throw this.errorHandler.error('notFound', { info: 'one or more users' });
		}

		// all users must be a member of the team 
		if (users.find(user => !user.hasTeam(this.team.id))) {
			throw this.errorHandler.error('updateAuth', { reason: 'one or more users are not a member of the team' });
		}

		// save removed users for later use
		if (
			this.attributes.$pull &&
			this.attributes.$pull.memberIds
		) {
			this.removedUsers = users;
		}
	}

	// for any users being removed from the team, update their teamIds array
	async removeUsersFromTeam () {
		if (!this.removedUsers) {
			return;
		}
		await Promise.all(this.removedUsers.map(async user => {
			await this.removeUserFromTeam(user);
		}));
	}

	// for a user being removed from the team, update their teamIds array
	async removeUserFromTeam (user) {
		await this.data.users.applyOpById(
			user.id,
			{ $pull: { teamIds: this.team.id } }
		);
	}
}

module.exports = TeamUpdater;
