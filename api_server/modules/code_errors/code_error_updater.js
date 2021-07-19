// this class should be used to update code error documents in the database

'use strict';

const ModelUpdater = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_updater');
const CodeError = require('./code_error');
const ArrayUtilities = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/array_utilities');
const RepoIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/repos/indexes');

class CodeErrorUpdater extends ModelUpdater {

	get modelClass () {
		return CodeError;	// class to use to create a code error model
	}

	get collectionName () {
		return 'codeErrors';	// data collection to use
	}

	// convenience wrapper
	async updateCodeError (id, attributes) {
		return await this.updateModel(id, attributes);
	}

	// get attributes that are allowed, we will ignore all others
	getAllowedAttributes () {
		return {
			string: ['status', 'ticketUrl', 'ticketProviderId'],
			object: ['stackInfo', '$addToSet', '$push', '$pull']
		};
	}

	// validate the input attributes
	validateAttributes () {
		const addRemoveAttributes = ['assignees'];
		
		// we restrict directives only to certain attributes
		const error = this.normalizeDirectives(addRemoveAttributes);
		if (error) { 
			return error;
		}

		this.haveAddAndRemove = {};
		for (let attribute of addRemoveAttributes) {
			// $push is made equivalent to $addToSet
			if (this.attributes.$push && this.attributes.$push[attribute]) {
				this.attributes.$addToSet = this.attributes.$addToSet || {};
				this.attributes.$addToSet[attribute] = [
					...(this.attributes.$addToSet[attribute] || []),
					...this.attributes.$push[attribute]
				];
				delete this.attributes.$push[attribute];
			}
			
			// can't add and remove the same thing
			if (
				this.attributes.$addToSet &&
				this.attributes.$pull &&
				this.attributes.$addToSet[attribute] &&
				this.attributes.$pull[attribute]
			) {
				const offendingElements = ArrayUtilities.intersection(this.attributes.$addToSet[attribute], this.attributes.$pull[attribute]);
				if (offendingElements.length > 0) {
					return `can not add and remove ${attribute} at the same time: ${offendingElements}`;
				}
				this.haveAddAndRemove[attribute] = true;
			}
		}
		delete this.attributes.$push;
	}

	normalizeDirectives (addRemoveAttributes) {
		for (let directive of ['$addToSet', '$push', '$pull']) {
			if (this.attributes[directive]) {
				const value = this.attributes[directive];
				delete this.attributes[directive];
				for (let attribute of addRemoveAttributes) {
					if (value[attribute]) {
						if (typeof value[attribute] === 'string') {
							value[attribute] = [value[attribute]];
						}
						else if (!(value[attribute] instanceof Array)) {
							return `${attribute} must be array`;
						}
						this.attributes[directive] = this.attributes[directive] || {};
						this.attributes[directive][attribute] = value[attribute];
					}
				}
			}
		}
	}

	// called before the code error is actually saved
	async preSave () {
		// proceed with the save...
		this.attributes.modifiedAt = Date.now();
		this.codeError = await this.data.codeErrors.getById(this.id);

		// confirm that users being added or removed as assignees are legit
		await this.confirmUsers();

		// we have to special case adding and removing array attributes at the same time, since
		// mongo won't allow us to $addToSet and $pull the same attribute ... in this case,
		// we'll treat the $pull part after the $addToSet part with a separate operation
		this.pullOps = {};
		for (let attribute in this.haveAddAndRemove) {
			this.pullOps[attribute] = this.attributes.$pull[attribute];
			delete this.attributes.$pull[attribute];
		}
		if (Object.keys(this.haveAddAndRemove).length > 0) {
			delete this.attributes.$pull;
		}

		// if we are adding assignees, make sure they are followers
		this.handleAssignees();

		// if we're updating to resolved, set the resolvedAt attribute
		if (this.attributes.status === 'resolved') {
			this.attributes.resolvedAt = this.attributes.modifiedAt;
		}
		
		await super.preSave();
	}

	// get all the repos known to this team
	async getTeamRepos () {
		this.team = await this.data.teams.getById(this.codeError.get('teamId'));
		if (!this.team) {
			this.teamRepos = []; // shouldn't happen
			return;
		}
		this.teamRepos = await this.data.repos.getByQuery(
			{ 
				teamId: this.team.id
			},
			{ 
				hint: RepoIndexes.byTeamId 
			}
		);
	}

	// handle any assignees being added or removed
	async handleAssignees () {
		if (this.attributes.$addToSet && this.attributes.$addToSet.assignees) {
			const currentFollowerIds = this.codeError.get('followerIds') || [];
			const newFollowerIds = ArrayUtilities.difference(this.attributes.$addToSet.assignees, currentFollowerIds);
			if (newFollowerIds.length > 0) {
				this.attributes.$addToSet.followerIds = newFollowerIds;
			}
		}
	}

	// confirm that the IDs for the users being added or removed as assignees are valid
	async confirmUsers () {
		let userIds = [];
		if (this.attributes.$addToSet && this.attributes.$addToSet.assignees) {
			userIds.push(...this.attributes.$addToSet.assignees);
		}
		if (this.attributes.$pull && this.attributes.$pull.assignees) {
			userIds.push(...this.attributes.$pull.assignees);
		}
		if (userIds.length === 0) {
			return;
		}

		// all users must actually exist
		const users = await this.request.data.users.getByIds(userIds);
		const foundUserIds = users.map(user => user.id);
		const notFoundUserIds = ArrayUtilities.difference(userIds, foundUserIds);
		if (notFoundUserIds.length > 0) {
			throw this.errorHandler.error('notFound', { info: `one or more users: ${notFoundUserIds}` });
		}

		// all users must be a member of the team that owns the code error
		if (users.find(user => !user.hasTeam(this.codeError.get('teamId')))) {
			throw this.errorHandler.error('updateAuth', { reason: 'one or more users are not a member of the team that owns the code error' });
		}
	}


	// we have to special case adding and removing array attributes at the same time, since
	// mongo won't allow us to $addToSet and $pull the same attribute
	async handleAddRemove () {
		// so here we are being called right before the response is returned to the server,
		// the add part of the operation has happened successfully and persisted to the database,
		// so we need to "cheat" and do the remove part ... we'll do a direct-to-database operation,
		// then return the operation in the response as if it was atomic
		const op = {};
		for (let attribute in this.pullOps) {
			op.$pull = op.$pull || {};
			op.$pull[attribute] = { $in: this.pullOps[attribute] };
			this.request.responseData.codeError.$pull = this.request.responseData.codeError.$pull || {};
			this.request.responseData.codeError.$pull = { [attribute]: this.pullOps[attribute] };
		}

		if (op.$pull) {
			await this.data.codeErrors.updateDirect({ id: this.data.codeErrors.objectIdSafe(this.codeError.id) }, op);
		}
	}
}

module.exports = CodeErrorUpdater;
