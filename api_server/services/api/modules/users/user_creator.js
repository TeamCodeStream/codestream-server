'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var ModelCreator = require(process.env.CS_API_TOP + '/lib/util/restful/model_creator');
var UserValidator = require('./user_validator');
var User = require('./user');
var Allow = require(process.env.CS_API_TOP + '/lib/util/allow');
var PasswordHasher = require('./password_hasher');
var UsernameChecker = require('./username_checker');
const TeamErrors = require(process.env.CS_API_TOP + '/services/api/modules/teams/errors.js');

class UserCreator extends ModelCreator {

	constructor (options) {
		super(options);
		this.errorHandler.add(TeamErrors);
	}

	get modelClass () {
		return User;
	}

	get collectionName () {
		return 'users';
	}

	createUser (attributes, callback) {
		return this.createModel(attributes, callback);
	}

	getRequiredAttributes () {
		return ['email'];
	}

	validateAttributes (callback) {
		this.userValidator = new UserValidator();
		let error =
			this.validateEmail() ||
			this.validatePassword() ||
			this.validateUsername();
		callback(error);
	}

	validateEmail () {
		let error = this.userValidator.validateEmail(this.attributes.email);
		if (error) {
		 	return { email: error };
	 	}
	}

	validatePassword () {
		if (!this.attributes.password) { return; }
		let error = this.userValidator.validatePassword(this.attributes.password);
		if (error) {
			return { password: error };
		}
	}

	validateUsername () {
		if (!this.attributes.username) { return; }
		let error = this.userValidator.validateUsername(this.attributes.username);
		if (error) {
		 	return { username: error };
	 	}
	}

	allowAttributes (callback) {
		Allow(
			this.attributes,
			{
				string: ['email', 'password', 'username', 'firstName', 'lastName', 'confirmationCode'],
				number: ['confirmationAttempts', 'confirmationCodeExpiresAt'],
				boolean: ['isRegistered'],
				'array(string)': ['secondaryEmails']
			}
		);
		process.nextTick(callback);
	}

	modelCanExist (model) {
		return !model.get('isRegistered') || !this.notOkIfExistsAndRegistered;
	}

	checkExistingQuery () {
		return {
			searchableEmail: this.attributes.email.toLowerCase(),
			deactivated: false
		};
	}

	preSave (callback) {
		BoundAsync.series(this, [
			this.hashPassword,
			this.checkUsernameUnique,
			super.preSave
		], callback);
	}

	checkUsernameUnique (callback) {
		if (
			!this.existingModel ||
			(this.existingModel.get('teamIds') || []).length === 0
		) {
			return callback();
		}
		let username = this.attributes.username || this.existingModel.get('username');
		if (!username) {
			return callback();
		}
		let teamIds = this.existingModel.get('teamIds');
		let usernameChecker = new UsernameChecker({
			data: this.data,
			username: username,
			userId: this.existingModel.id,
			teamIds: teamIds
		});
		usernameChecker.checkUsernameUnique((error, isUnique) => {
			if (error) { return callback(error); }
			if (!isUnique) {
				return callback(this.errorHandler.error('usernameNotUnique', {
					info: {
						username: username,
						teamIds: usernameChecker.notUniqueTeamIds
					}
				}));
			}
			else {
				return callback();
			}
		});
	}

	hashPassword (callback) {
		if (!this.attributes.password) { return callback(); }
		new PasswordHasher({
			errorHandler: this.errorHandler,
			password: this.attributes.password
		}).hashPassword((error, passwordHash) => {
			if (error) { return callback(error); }
			this.attributes.passwordHash = passwordHash;
			delete this.attributes.password;
			process.nextTick(callback);
		});
	}

	create (callback) {
		this.model.attributes._id = this.collection.createId();
		if (this.user) {
			this.model.attributes.creatorId = this.user.id;
		}
		else {
			this.model.attributes.creatorId = this.model.attributes._id;
		}
		super.create(callback);
	}
}

module.exports = UserCreator;
