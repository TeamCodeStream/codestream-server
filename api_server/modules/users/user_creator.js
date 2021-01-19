// this class should be used to create all user documents in the database

'use strict';

const ModelCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_creator');
const UserValidator = require('./user_validator');
const User = require('./user');
const PasswordHasher = require('./password_hasher');
const UsernameChecker = require('./username_checker');
const Indexes = require('./indexes');
const TeamErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/teams/errors.js');
const EmailUtilities = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/email_utilities');
const UsernameValidator = require('./username_validator');
const ArrayUtilities = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/array_utilities');
const UUID = require('uuid/v4');
const Base64 = require('base-64');

// how long an invite code remains valid
const INVITE_CODE_EXPIRATION = 365 * 24 * 60 * 60 * 1000;

class UserCreator extends ModelCreator {

	constructor (options) {
		super(options);
		this.options = options;
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
			optional: {
				string: ['email', 'password', 'username', 'fullName', 'companyName', 'timeZone', 'confirmationCode', '_pubnubUuid', 'phoneNumber', 'iWorkOn', 'inviteTrigger'],
				number: ['confirmationAttempts', 'confirmationCodeExpiresAt', 'confirmationCodeUsableUntil'],
				boolean: ['isRegistered'],
				'array(string)': ['secondaryEmails', 'providerIdentities'],
				object: ['preferences', 'providerInfo', 'avatar']
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
		if (!this.attributes.email) { return; }
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

	// return whether a matching user can exist 
	modelCanExist () {
		return true;
	}

	// override base class function to check for an existing user that has already
	// been found, this is for the weird use case where a user is using a different
	// email address to sign up as an already existing (unregistered) account
	async checkExisting () {
		if (this.existingUser) {
			this.existingModel = this.existingUser;
		}
		else {
			await super.checkExisting();
		}
	}

	// return database query to check if a matching user already exists
	checkExistingQuery () {
		// allow faux users to create a user (even if their email matches)
		if (!this.attributes.email || (this.options && this.options.externalUserId)) return undefined;

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
		if (typeof this.request.isForTesting === 'function' && this.request.isForTesting()) { // special for-testing header for easy wiping of test data
			this.attributes._forTesting = true;
		}
		if (this.attributes._pubnubUuid) {
			this.request.log(`Pubnub uuid of ${this.attributes._pubnubUuid} provided`);
		}

		// never save attributes for an existing registered user
		if (
			this.existingModel &&
			this.existingModel.get('isRegistered')
		) {
			this.dontSaveIfExists = true;
			this.notSaving = true;
		}

		// if username not provided, generate it from email
		if (!this.notSaving && !this.attributes.username) {
			this.attributes.username = UsernameValidator.normalize(
				EmailUtilities.parseEmail(this.attributes.email).name
			);
			this.usernameCameFromEmail = true;	// this will force a resolution of uniqueness conflict, rather than an error
		}

		if (this.options && this.options.externalUserId) {
			this.attributes.externalUserId = this.options.externalUserId;
		}

		if (this.userBeingAddedToTeamId && (!this.options || !this.options.dontSetInviteCode)) {
			this.setInviteInfo();			// set an invite code for the user to accept an invite
		}

		await this.hashPassword();			// hash the user's password, if given
		await this.checkUsernameUnique();	// check if the user's username will be unique for the teams they are on
		await super.preSave();
	}

	// set an invite code and other invite info for the user to accept an invite, as needed
	setInviteInfo () {
		// existing registered users don't get an invite code
		if (this.existingModel && this.existingModel.get('isRegistered')) {
			return;
		}

		// if user being added to team, generate an invite code and save it as a signup token
		if (!this.existingModel || !this.existingModel.get('inviteCode')) {
			this.inviteCode = this.attributes.inviteCode = this.generateInviteCode();
		}

		// set lastInviteType, can be triggered by a review or codemark notification
		if (this.options.inviteType) {
			this.attributes.lastInviteType = this.options.inviteType;
		}
		else if (this.attributes.inviteTrigger) {
			if (this.attributes.inviteTrigger.startsWith('R')) {
				this.attributes.lastInviteType = 'reviewNotification';
			}
			else if (this.attributes.inviteTrigger.startsWith('C')) {
				this.attributes.lastInviteType = 'codemarkNotification';
			}
		}
		else if (this.existingModel && !this.existingModel.get('isRegistered')) {
			this.attributes.lastInviteType = 'reinvitation';
		}
		else {
			this.attributes.lastInviteType = 'invitation';
		}

		// set firstInviteType, only for new users
		if (this.attributes.lastInviteType && !this.existingModel) {
			this.attributes.firstInviteType = this.attributes.lastInviteType;
		}
	}

	// generate an invite code ... this might be a simple GUID, or it might have baked-in
	// data for on-prem usage
	generateInviteCode () {
		let inviteCode = UUID();
		if (this.options.inviteInfo) {
			const { serverUrl, disableStrictSSL } = this.options.inviteInfo;
			const uuid = inviteCode.substring(0, 8);
			const inviteInfo = `${uuid}${disableStrictSSL ? '1' : '0'}${serverUrl}`;
			inviteCode = '$01$' + Base64.encode(inviteInfo);
		}
		return inviteCode;
	}

	// hash the given password, as needed
	async hashPassword () {
		if (!this.attributes.password || this.notSaving) { return; }
		this.attributes.passwordHash = await new PasswordHasher({
			errorHandler: this.errorHandler,
			password: this.attributes.password
		}).hashPassword();
		delete this.attributes.password;
	}

	// check if the user's username will be unique for the teams they are on
	async checkUsernameUnique () {
		if (this.notSaving && !this.teamIds) {
			// doesn't matter if we won't be saving anyway, meaning we're really ignoring the username
			return;
		}
		let teamIds = this.teamIds || [];
		if (this.existingModel) {
			const existingUserTeams = this.existingModel.get('teamIds') || [];
			if (ArrayUtilities.difference(existingUserTeams, teamIds).length === 0) {
				return;
			}
			teamIds = [...teamIds, ...this.existingModel.get('teamIds') || []];
		}
		const username = this.attributes.username || (this.existingModel ? this.existingModel.get('username') : null);
		if (!username) {
			// username not provided === no worries
			return;
		}
		// check against all teams ... the username must be unique for each
		const userId = this.existingModel ? this.existingModel.id : null;
		const usernameChecker = new UsernameChecker({
			data: this.data,
			username,
			userId,
			teamIds,
			resolveTillUnique: this.usernameCameFromEmail 	// don't do an error on conflict, instead append a number to the username till it's unique
		});
		const isUnique = await usernameChecker.checkUsernameUnique();
		if (isUnique) {
			this.attributes.username = usernameChecker.username;	// in case we forced it to resolve to a non-conflicting username
			return;
		}
		if (this.ignoreUsernameOnConflict) {
			if (!this.existingModel || !this.existingModel.get('isRegistered')) {
				// in some circumstances, we tolerate a conflict for unregistered users by just throwing away
				// the supplied username and going with the first part of the email, but we still need to resolve it
				this.attributes.username = UsernameValidator.normalize(
					EmailUtilities.parseEmail(this.attributes.email).name
				);
				this.usernameCameFromEmail = true;	// this will force a resolution of uniqueness conflict, rather than an error
				return await this.checkUsernameUnique();
			}
		}

		// on registration, we throw the error, but if user is being invited to the team, we tolerate it
		if (!this.userBeingAddedToTeamId) {
			throw this.errorHandler.error('usernameNotUnique', {
				info: {
					username: username,
					teamIds: usernameChecker.notUniqueTeamIds
				}
			});
		}
	}

	// create the user
	async create () {
		this.model.attributes.id = this.collection.createId();
		if (this.user) {
			// someone else is creating (inviting) this user
			this.model.attributes.creatorId = this.user.id;
		}
		else {
			// user creating themselves
			this.model.attributes.creatorId = this.model.attributes.id;
		}
		if (this.teamIds) {
			// NOTE - we don't allow setting this in the original attributes,
			// because we need to be able to trust it ... so in this case it can
			// only come from calling code, not from a request body
			this.model.attributes.teamIds = this.teamIds;
		}
		await super.create();
	}

	async determineChanges () {
		super.determineChanges();
		if (this.existingModel && this.existingModel.get('externalUserId') &&
			this.attributes.externalUserId) {
			this.changes.externalUserId = null;
		}
	}

	// after the user object is saved...
	async postSave () {
		// save an invite code as a signup token for this user
		await this.saveSignupToken();

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
		await this.api.services.broadcaster.grant(
			[this.model.id],
			`user-${this.model.id}`,
			() => {},
			{ request: this.request }
		);
	}

	// if we have an invite code 
	async saveSignupToken () {
		// if we have an invite code, save it as a signup token
		if (!this.inviteCode) {
			return;
		}

		let expiresIn = this.inviteCodeExpiresIn && this.inviteCodeExpiresIn < INVITE_CODE_EXPIRATION ?
			this.inviteCodeExpiresIn : INVITE_CODE_EXPIRATION;
		await this.api.services.signupTokens.insert(
			this.inviteCode,
			this.model.id,
			{
				requestId: this.request.request.id,
				secureExpiresIn: expiresIn,
				isInviteCode: true,
				more: {
					teamId: this.userBeingAddedToTeamId
				}
			}
		);
	}
}

module.exports = UserCreator;
