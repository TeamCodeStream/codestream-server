// this class should be used to update team documents in the database

'use strict';

const ModelUpdater = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_updater');
const Team = require('./team');
const ArrayUtilities = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/array_utilities');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');

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
			string: ['name', '_confirmationCheat'],
			object: ['$addToSet', '$push', '$pull', 'providerHosts']
		};
	}

	// validate the input attributes
	validateAttributes () {
		if (
			this.attributes.providerHosts &&
			this.attributes._confirmationCheat !== this.api.config.sharedSecrets.confirmationCheat
		) {
			// this is only for test purposes, for now, so can only be done with cheat code
			delete this.attributes.providerHosts;
		}

		// look for directives applied to memberIds or adminIds, we only allow a single directive at once
		let finalDirective = null;
		for (let directive of ['$push', '$pull', '$addToSet']) {
			const directiveTarget = this.attributes[directive];
			delete this.attributes[directive];	// essentially remove any non-matching directives 
			for (let attribute of ['removedMemberIds', 'adminIds']) {
				if (directiveTarget && directiveTarget[attribute]) {
					if (finalDirective) {
						return 'can only update one ID array at once and with a single directive';
					}
					if (directive === '$push') {
						// substitute $addToSet for $push, tolerating the looser $push as synonymous
						directive = '$addToSet';
					}
					if (directive === '$pull' && attribute === 'removedMemberIds') {
						// POST /users is the proper way to add a user to the team
						return 'can not remove users from removedMemberIds, use POST /users with email to add them back to the team';
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
				finalDirective.$addToSet &&
				finalDirective.$addToSet.removedMemberIds
			) {
				// if removing users from the team, also remove them as admins
				this.removingUserIds = finalDirective.$addToSet.removedMemberIds;
				this.attributes.$pull = { adminIds: finalDirective.$addToSet.removedMemberIds };
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
		let memberIds = 
		(
			this.attributes.$addToSet && 
			this.attributes.$addToSet.adminIds
		) || 
		(
			this.attributes.$pull && 
			this.attributes.$pull.adminIds
		) || 
		(
			this.attributes.$addToSet &&
			this.attributes.$addToSet.removedMemberIds
		) || 
		[];
		if (memberIds.length === 0) {
			return;
		}

		// only admins can perform these operations
		if (!(this.team.get('adminIds') || []).includes(this.user.id)) {
			// the one exception is a user removing themselves from a team
			if (
				!this.removingUserIds || 
				this.removingUserIds.find(id => id !== this.user.id)
			) {
				throw this.errorHandler.error('adminsOnly');
			}
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
			this.attributes.$addToSet &&
			this.attributes.$addToSet.removedMemberIds
		) {
			this.transforms.removedUsers = users;
		}
	}

	// for any users being removed from the team, update their teamIds array
	async removeUsersFromTeam () {
		if (!this.transforms.removedUsers) {
			return;
		}
		this.transforms.userUpdates = [];
		await Promise.all(this.transforms.removedUsers.map(async user => {
			await this.removeUserFromTeam(user);
		}));
	}

	// for a user being removed from the team, update their teamIds array
	async removeUserFromTeam (user) {
		const op = {
			$pull: {
				teamIds: this.team.id 
			},
			$set: {
				modifiedAt: Date.now()
			}
		};

		// unregistered users who are left with no team are simply deactivated
		if (
			!user.get('isRegistered') && 
			user.get('teamIds').length === 1 &&
			user.get('teamIds')[0] === this.team.id
		) {
			const emailParts = user.get('email').split('@');
			const now = Date.now();
			const newEmail = `${emailParts[0]}-deactivated${now}@${emailParts[1]}`;
			Object.assign(op.$set, {
				deactivated: true,
				email: newEmail,
				searchableEmail: newEmail.toLowerCase()
			});
		}

		const updateOp = await new ModelSaver({
			request: this.request,
			collection: this.request.data.users,
			id: user.id
		}).save(op);
		this.transforms.userUpdates.push(updateOp);
	}
}

module.exports = TeamUpdater;
