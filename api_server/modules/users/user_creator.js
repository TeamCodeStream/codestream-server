// this class should be used to create all user documents in the database

'use strict';

const ModelCreator = require(process.env.CS_API_TOP + '/lib/util/restful/model_creator');
const UserValidator = require('./user_validator');
const User = require('./user');
const PasswordHasher = require('./password_hasher');
const UsernameChecker = require('./username_checker');
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
	async createUser (attributes) {
		return await this.createModel(attributes);
	}

	// get attributes that are required for user creation, and those that are optional,
	// along with their types
	getRequiredAndOptionalAttributes () {
		return {
			required: {
				string: ['email']
			},
			optional: {
				string: ['password', 'username', 'firstName', 'lastName', 'timeZone', 'confirmationCode', '_pubnubUuid'],
				number: ['confirmationAttempts', 'confirmationCodeExpiresAt'],
				boolean: ['isRegistered'],
				'array(string)': ['secondaryEmails'],
				object: ['preferences']
			}
		};
	}

	// validate attributes for the user we are creating
	async validateAttributes () {
		this.userValidator = new UserValidator();
		return this.validateEmail() ||
			this.validatePassword() ||
			this.validateUsername();
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
	async preSave () {
		if (this.request.isForTesting()) { // special for-testing header for easy wiping of test data
			this.attributes._forTesting = true;
		}
		if (this.attributes._pubnubUuid) {
			this.request.log(`Pubnub uuid of ${this.attributes._pubnubUuid} provided`);
		}
		await this.hashPassword();			// hash the user's password, if given
		await this.checkUsernameUnique();	// check if the user's username will be unique for the teams they are on
		await super.preSave();
	}

	// check if the user's username will be unique for the teams they are on
	async checkUsernameUnique () {
		if (this.existingModel && this.dontSaveIfExists) {
			// doesn't matter if we won't be saving anyway, meaning we're really ignoring the username
			return;
		}
		const teamIds = (this.existingModel ? this.existingModel.get('teamIds') : this.teamIds) || [];
		const username = this.attributes.username || (this.existingModel ? this.existingModel.get('username') : null);
		if (!username) {
			// username not provided === no worries
			return ;
		}
		// check against all teams ... the username must be unique for each
		const userId = this.existingModel ? this.existingModel.id : null;
		const usernameChecker = new UsernameChecker({
			data: this.data,
			username,
			userId,
			teamIds
		});
		const isUnique = await usernameChecker.checkUsernameUnique();
		if (isUnique) {
			return;
		}
		if (this.ignoreUsernameOnConflict && !this.existingModel) {
			// in some circumstances, we tolerate a conflict by just throwing away
			// the supplied username
			delete this.attributes.username;
			return;
		}
		else {
			throw this.errorHandler.error('usernameNotUnique', {
				info: {
					username: username,
					teamIds: usernameChecker.notUniqueTeamIds
				}
			});
		}
	}

	// hash the given password, as needed
	async hashPassword () {
		if (!this.attributes.password) { return; }
		this.attributes.passwordHash = await new PasswordHasher({
			errorHandler: this.errorHandler,
			password: this.attributes.password
		}).hashPassword();
		delete this.attributes.password;
	}

	// create the user
	async create () {
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
		await super.create();
	}

	// after the user object is saved...
	async postSave () {
		// grant the user access to their own me-channel, strictly for testing purposes
		// (since they are not confirmed yet)
		await this.grantMeChannel();
	}

	// grant the user access to their own me-channel, strictly for testing purposes
	// (since they are not confirmed yet)
	async grantMeChannel () {
		// subscription cheat must be provided by test script
		if (!this.subscriptionCheat) {
			return;
		}
		// allow unregistered users to subscribe to me-channel, needed for mock email testing
		this.api.warn(`NOTE - granting subscription permission to me channel for unregistered user ${this.model.id}, this had better be a test!`);
		await this.api.services.messager.grant(
			[this.model.id],
			`user-${this.model.id}`,
			() => {},
			{ request: this.request	}
		);
	}
}

module.exports = UserCreator;
