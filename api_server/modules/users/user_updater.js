// this class should be used to update user documents in the database

'use strict';

const ModelUpdater = require(process.env.CS_API_TOP + '/lib/util/restful/model_updater');
const User = require('./user');
const UsernameChecker = require('./username_checker');
const TeamErrors = require(process.env.CS_API_TOP + '/modules/teams/errors');

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
			string: ['username', 'firstName', 'lastName', 'timeZone']
		};
	}

	// before the user info gets saved...
	async preSave () {
		await this.getUser();
		await this.checkUsernameUnique();
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

	// if the user is changing their username, we need to check if the name is unique
	// for all teams the user is in
	async checkUsernameUnique () {
		if (!this.attributes.username) {
			return;
		}
		if ((this.user.get('teamIds') || []).length === 0) {
			return;
		}
		const usernameChecker = new UsernameChecker({
			data: this.request.data,
			username: this.attributes.username,
			userId: this.user.id,
			teamIds: this.user.get('teamIds')
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
