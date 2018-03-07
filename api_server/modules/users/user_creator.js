'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var ModelCreator = require(process.env.CS_API_TOP + '/lib/util/restful/model_creator');
var UserValidator = require('./user_validator');
var User = require('./user');
var PasswordHasher = require('./password_hasher');
var UsernameChecker = require('./username_checker');
const Indexes = require('./indexes');
const TeamErrors = require(process.env.CS_API_TOP + '/modules/teams/errors.js');

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

	getRequiredAndOptionalAttributes () {
		return {
			required: {
				string: ['email']
			},
			optional: {
				string: ['password', 'username', 'firstName', 'lastName', 'confirmationCode'],
				number: ['confirmationAttempts', 'confirmationCodeExpiresAt'],
				boolean: ['isRegistered'],
				'array(string)': ['secondaryEmails'],
				object: ['preferences']
			}
		};
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

	modelCanExist (model) {
		return !model.get('isRegistered') || !this.notOkIfExistsAndRegistered;
	}

	checkExistingQuery () {
		return {
			query: {
				searchableEmail: this.attributes.email.toLowerCase()
			},
			hint: Indexes.bySearchableEmail
		};
	}

	preSave (callback) {
		if (this.request.isForTesting()) { // special for-testing header for easy wiping of test data
			this.attributes._forTesting = true;
		}
		BoundAsync.series(this, [
			this.hashPassword,
			this.checkUsernameUnique,
			super.preSave
		], callback);
	}

	checkUsernameUnique (callback) {
		if (this.existingModel && this.dontSaveIfExists) {
			return callback();
		}
		const teamIds = (this.existingModel ? this.existingModel.get('teamIds') : this.teamIds) || [];
		const username = this.attributes.username || (this.existingModel ? this.existingModel.get('username') : null);
		if (!username) {
			return callback();
		}
		const userId = this.existingModel ? this.existingModel.id : null;
		let usernameChecker = new UsernameChecker({
			data: this.data,
			username,
			userId,
			teamIds
		});
		usernameChecker.checkUsernameUnique((error, isUnique) => {
			if (error) { return callback(error); }
			if (isUnique) {
				return callback();
			}
			if (this.ignoreUsernameOnConflict && !this.existingModel) {
				delete this.attributes.username;
				return callback();
			}
			else {
				return callback(this.errorHandler.error('usernameNotUnique', {
					info: {
						username: username,
						teamIds: usernameChecker.notUniqueTeamIds
					}
				}));
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
		if (this.teamIds) {
			// NOTE - we don't allow setting this in the original attributes,
			// because we need to be able to trust it
			this.model.attributes.teamIds = this.teamIds;
		}
		super.create(callback);
	}

	postSave (callback) {
		this.grantMeChannel(callback);
	}

	grantMeChannel (callback) {
		if (!this.subscriptionCheat) {
			return callback();
		}
		// allow unregistered users to subscribe to me-channel, needed for mock email testing
		this.api.warn(`NOTE - granting subscription permission to me channel for unregistered user ${this.model.id}, this had better be a test!`);
		this.api.services.messager.grant(
			[this.model.id],
			`user-${this.model.id}`,
			() => {},
			{
				request: this.request
			}
		);
		callback();
	}
}

module.exports = UserCreator;
