// this class should be used to update user documents in the database

'use strict';

var ModelUpdater = require(process.env.CS_API_TOP + '/lib/util/restful/model_updater');
var User = require('./user');
var UsernameChecker = require('./username_checker');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
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
	updateUser (id, attributes, callback) {
		return this.updateModel(id, attributes, callback);
	}

	// get attributes that are allowed, we will ignore all others
	getAllowedAttributes () {
		return {
			string: ['username', 'firstName', 'lastName', 'timeZone']
		};
	}

	// before the user info gets saved...
	preSave (callback) {
		BoundAsync.series(this, [
			this.getUser,
			this.checkUsernameUnique,
			super.preSave
		], callback);
	}

	// get the user needed for save
	getUser (callback) {
		if (!this.attributes.username) {
			// only necessary for username checks
			return callback();
		}
		this.request.data.users.getById(
			this.id,
			(error, user) => {
				if (error) { return callback(error); }
				if (!user) {
					return callback(this.errorHandler.error('notFound', { info: user }));
				}
				this.user = user;
				callback();
			}
		);
	}

	// if the user is changing their username, we need to check if the name is unique
	// for all teams the user is in
	checkUsernameUnique (callback) {
		if (!this.attributes.username) {
			return callback();
		}
		if ((this.user.get('teamIds') || []).length === 0) {
			return callback();
		}
		let usernameChecker = new UsernameChecker({
			data: this.request.data,
			username: this.attributes.username,
			userId: this.user.id,
			teamIds: this.user.get('teamIds')
		});
		usernameChecker.checkUsernameUnique((error, isUnique) => {
			if (error) { return callback(error); }
			if (!isUnique) {
				return callback(this.errorHandler.error('usernameNotUnique', {
					info: {
						username: this.attributes.username,
						teamIds: usernameChecker.notUniqueTeamIds
					}
				}));
			}
			else {
				return callback();
			}
		});
	}

	// after the post has been saved...
	postSave (callback) {
		// this.update is what we return to the client, since the modifiedAt
		// has changed, add that
		this.update.modifiedAt = this.model.get('modifiedAt');
		callback();
	}
}

module.exports = UserUpdater;
