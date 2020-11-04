// this class should be used to update user documents in the database

'use strict';

const ModelUpdater = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_updater');
const User = require('./user');
const UsernameChecker = require('./username_checker');
const TeamErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/teams/errors');

class UserUpdater extends ModelUpdater {

	constructor (options) {
		super(options);
		this.errorHandler.add(TeamErrors);
	}

	get modelClass () {
		return User;	// class to use to create a user model
	}

	get collectionName () {
		return 'users';	// data collection to use
	}

	// convenience wrapper
	async updateUser (id, attributes) {
		return await this.updateModel(id, attributes);
	}

	// get attributes that are allowed, we will ignore all others
	getAllowedAttributes () {
		return {
			string: ['username', 'fullName', 'timeZone', 'phoneNumber', 'iWorkOn'],
			object: ['modifiedRepos', 'compactModifiedRepos', 'status', 'avatar']
		};
	}

	// before the user info gets saved...
	async preSave () {
		await this.getUser();
		await this.checkUsernameUnique();
		await this.handleModifiedRepos();
		this.attributes.modifiedAt = Date.now();
		await super.preSave();
	}

	// get the user needed for save
	async getUser () {
		if (!this.attributes.username) {
			// only necessary for username checks
			return;
		}
		this.user = await this.request.data.users.getById(this.id);
		if (!this.user) {
			throw this.errorHandler.error('notFound', { info: 'user' });
		}
	}

	// if the user is sending modifiedRepos, this is per-team
	async handleModifiedRepos () {
		if (!this.attributes.modifiedRepos && !this.attributes.compactModifiedRepos) {
			return;
		}
		if (this.attributes.compactModifiedRepos && this.attributes.modifiedRepos) {
			throw this.errorHandler.error('validation', { reason: 'cannot provide modifiedRepos and compactModifiedRepos at the same time' });
		}

		const now = Date.now();
		this.attributes.$set = {};
		const which = this.attributes.modifiedRepos ? 'modifiedRepos' : 'compactModifiedRepos';
		Object.keys(this.attributes[which]).forEach(teamId => {
			if (!this.user.hasTeam(teamId)) {
				throw this.errorHandler.error('updateAuth', { reason: `user can not set ${which} for team ${teamId} since they are not a member` });
			}
			this.attributes.$set[`${which}.${teamId}`] = this.attributes[which][teamId];
			this.attributes.$set[`modifiedReposModifiedAt.${teamId}`] = now;
		});
		delete this.attributes[which];
	}

	// if the user is changing their username, we need to check if the name is unique
	// for all teams the user is in
	async checkUsernameUnique () {
		if (!this.attributes.username) {
			return;
		}
		const teamIds = this.user.get('teamIds') || [];
		const usernameChecker = new UsernameChecker({
			data: this.request.data,
			username: this.attributes.username,
			userId: this.user.id,
			teamIds
		});
		const isUnique = await usernameChecker.checkUsernameUnique();
		if (!isUnique) {
			throw this.errorHandler.error('usernameNotUnique', {
				info: {
					username: this.attributes.username,
					teamIds: usernameChecker.notUniqueTeamIds
				}
			});
		}
	}
}

module.exports = UserUpdater;
