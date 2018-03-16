// this class should be used to create all user documents in the database

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
		return User;	// class to use to create a user model
	}

	get collectionName () {
		return 'users';	// data collection to use
	}

	// convenience wrapper
	createUser (attributes, callback) {
		return this.createModel(attributes, callback);
	}

	// get attributes that are required for user creation, and those that are optional,
	// along with their types
	getRequiredAndOptionalAttributes () {
		return {
			required: {
				string: ['email']
			},
			optional: {
				string: ['password', 'username', 'firstName', 'lastName', 'confirmationCode', '_pubnubUuid'],
				number: ['confirmationAttempts', 'confirmationCodeExpiresAt'],
				boolean: ['isRegistered'],
				'array(string)': ['secondaryEmails'],
				object: ['preferences']
			}
		};
	}

	// validate attributes for the user we are creating
	validateAttributes (callback) {
		this.userValidator = new UserValidator();
		let error =
			this.validateEmail() ||
			this.validatePassword() ||
			this.validateUsername();
		callback(error);
	}

	// validate the given email
	validateEmail () {
		let error = this.userValidator.validateEmail(this.attributes.email);
		if (error) {
			return { email: error };
		}
	}

	// validate the given password
	validatePassword () {
		if (!this.attributes.password) { return; }
		let error = this.userValidator.validatePassword(this.attributes.password);
		if (error) {
			return { password: error };
		}
	}

	// validate the given username
	validateUsername () {
		if (!this.attributes.username) { return; }
		let error = this.userValidator.validateUsername(this.attributes.username);
		if (error) {
			return { username: error };
		}
	}

	// return whether a matching user can exist or if an error should be returned
	modelCanExist (model) {
		// if the user is not registered, we'll just return that user, so this is ok,
		// but if the user is registered, let the caller define the situation
		return !model.get('isRegistered') || !this.notOkIfExistsAndRegistered;
	}

	// return database query to check if a matching user already exists
	checkExistingQuery () {
		// look for matching email (case-insensitive)
		return {
			query: {
				searchableEmail: this.attributes.email.toLowerCase()
			},
			hint: Indexes.bySearchableEmail
		};
	}

	// called before the user is actually saved
	preSave (callback) {
		if (this.request.isForTesting()) { // special for-testing header for easy wiping of test data
			this.attributes._forTesting = true;
		}
		if (this.attributes._pubnubUuid) {
			this.request.log(`Pubnub uuid of ${this.attributes._pubnubUuid} provided`);
		}
		BoundAsync.series(this, [
			this.hashPassword,			// hash the user's password, if given
			this.checkUsernameUnique,	// check if the user's username will be unique for the teams they are on
			super.preSave
		], callback);
	}

	// check if the user's username will be unique for the teams they are on
	checkUsernameUnique (callback) {
		if (this.existingModel && this.dontSaveIfExists) {
			// doesn't matter if we won't be saving anyway, meaning we're really ignoring the username
			return callback();
		}
		const teamIds = (this.existingModel ? this.existingModel.get('teamIds') : this.teamIds) || [];
		const username = this.attributes.username || (this.existingModel ? this.existingModel.get('username') : null);
		if (!username) {
			// username not provided, no worries
			return callback();
		}
		// check against all teams ... the username must be unique for each
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
				// in some circumstances, we tolerate a conflict by just throwing away
				// the supplied username
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

	// hash the given password, as needed
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

	// create the user
	create (callback) {
		this.model.attributes._id = this.collection.createId();
		if (this.user) {
			// someone else is creating (inviting) this user
			this.model.attributes.creatorId = this.user.id;
		}
		else {
			// user creating themselves
			this.model.attributes.creatorId = this.model.attributes._id;
		}
		if (this.teamIds) {
			// NOTE - we don't allow setting this in the original attributes,
			// because we need to be able to trust it ... so in this case it can
			// only come from calling code, not from a request body
			this.model.attributes.teamIds = this.teamIds;
		}
		super.create(callback);
	}

	// after the user object is saved...
	postSave (callback) {
		// grant the user access to their own me-channel, strictly for testing purposes
		// (since they are not confirmed yet)
		this.grantMeChannel(callback);
	}

	// grant the user access to their own me-channel, strictly for testing purposes
	// (since they are not confirmed yet)
	grantMeChannel (callback) {
		// subscription cheat must be provided by test script
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
