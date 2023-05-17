// this class should be used to update team documents in the database

'use strict';

const ModelUpdater = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_updater');
const Team = require('./team');
const ArrayUtilities = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/array_utilities');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');
const IsCodeStreamOnly = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/companies/is_codestream_only');

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
		delete this.attributes._confirmationCheat;

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

		// with unified identity, membership changes can only be made for orgs that are "codestream-only
		this.company = await this.data.companies.getById(this.team.get('companyId'));
		if (!this.company) {
			throw this.errorHandler.error('notFound', { info: 'parent company' }); // should never happen
		}
		const codestreamOnly = await IsCodeStreamOnly(this.company, this.request);
		if (!codestreamOnly) {
			// immediately abort, save the change in company to non-codestream only,
			// and publish corresponding message
			await this.request.persist();
			await this.publishCompanyNoCSOnly();
			throw this.errorHandler.error('notAuthorizedToAdmin', { reason: 'membership in this company is managed by New Relic' });
		}

		// only admins can perform these operations
		if (!(this.team.get('adminIds') || []).includes(this.user.id)) {
			// the one exception is a user removing themselves from a team
			// per https://issues.newrelic.com/browse/NR-60778 this is no longer true
			if (true
				/*
				!this.removingUserIds || 
				this.removingUserIds.find(id => id !== this.user.id)
				*/
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
		this.transforms.removedUserEmails = {};
		await Promise.all(this.transforms.removedUsers.map(async user => {
			await this.removeUserFromTeam(user);
		}));
	}

	// for a user being removed from the team, update their teamIds array
	async removeUserFromTeam (user) {
		const originalEmail = user.get('email');
		const op = {
			$pull: {
				teamIds: this.team.id,
				companyIds: this.team.get('companyId')
			},
			$set: {
				modifiedAt: Date.now()
			}
		};

		// under one-user-per-org, the user record is always deactivated, even for registered users
		if (true
			/*!user.get('isRegistered') && 
			user.get('teamIds').length === 1 &&
			user.get('teamIds')[0] === this.team.id*/
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
		this.transforms.removedUserEmails[user.id] = originalEmail;
	}

	// if the company object has changed (because it was found to no longer be "codestream only"),
	// publish the change to the team channel
	async publishCompanyNoCSOnly () {
		if (!this.request.transforms.updateCompanyNoCSOnly) {
			return;
		}

		// publish the change to all users on the "everyone" team
		const channel = 'team-' + this.team.id;
		const message = {
			company: this.transforms.updateCompanyNoCSOnly,
			requestId: this.request.request.id
		};;
		try {
\			await this.request.api.services.broadcaster.publish(
				message,
				channel,
				{ request: this.request }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.warn(`Could not publish updated company message to team ${this.team.id}: ${JSON.stringify(error)}`);
		}
	}
}

module.exports = TeamUpdater;
