// this class should be used to create all user documents in the database

'use strict';

const ModelCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_creator');
const UserValidator = require('./user_validator');
const User = require('./user');
const PasswordHasher = require('./password_hasher');
const EmailUtilities = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/email_utilities');
const UsernameValidator = require('./username_validator');

class UserCreator extends ModelCreator {

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
				string: [
					'email',
					'password',
					'username',
					'fullName',
					'timeZone',
					'confirmationCode',
					'_pubnubUuid',
					'phoneNumber',
					'iWorkOn',
					'inviteTrigger',
					'source',
					'passwordHash',
					'joinMethod',
					'originUserId',
					'copiedFromUserId',
					'countryCode'
				],
				number: ['confirmationAttempts', 'confirmationCodeExpiresAt', 'confirmationCodeUsableUntil'],
				object: ['preferences', 'avatar', 'providerInfo'],
				'array(string)': ['providerIdentities']
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

	// check for an existing user
	async getExistingModel () {
		if (this.force) {
			// this forces a new user document to be created no matter what
			return;
		}
		
		// in this case, if the caller provided an existing user, we use that one,
		// otherwise the logic will create a new user record (even with the same email)
		return this.existingUser;
	}

	// called before the user is actually saved
	async preSave () {
		if (typeof this.request.isForTesting === 'function' && this.request.isForTesting()) { // special for-testing header for easy wiping of test data
			this.attributes._forTesting = true;
		}
		if (this.attributes._pubnubUuid) {
			this.request.log(`Pubnub uuid of ${this.attributes._pubnubUuid} provided`);
		}

		// if username not provided, generate it from email
		if (!this.attributes.username) {
			if (this.existingModel) {
				this.attributes.username = this.existingModel.get('username');
			}
			if (!this.attributes.username) {
				this.attributes.username = UsernameValidator.normalize(
					EmailUtilities.parseEmail(this.attributes.email).name
				);
			}
		}

		// these attributes can be passed in as options, but aren't directly user-settable
		['externalUserId', 'providerIdentities', 'nrUserId'].forEach(attribute => {
			if (this[attribute]) {
				this.attributes[attribute] = this[attribute];
			}
		});

		// for invited users, set invite info
		if (this.team) {
			this.setInviteInfo();
			this.attributes.teamIds = [this.team.id];
			this.attributes.companyIds = [this.team.get('companyId')];
		}

		// set id and creatorId
		this.attributes.id = (this.existingModel && this.existingModel.id) || this.collection.createId();
		if (!this.attributes.originUserId && !this.existingModel) {
			this.attributes.originUserId = this.attributes.id; // marks the first user record associated with this email
		}

		if (this.user) {
			// someone else is creating (inviting) this user
			this.attributes.creatorId = this.user.id;
		}
		else {
			// user creating themselves
			this.attributes.creatorId = this.attributes.id;
		}

		// save the user in IdP service, as needed
		await this.saveToIdP();

		// hash the user's password, if given
		await this.hashPassword();			

		await super.preSave();
	}

	// set an invite code and other invite info for the user to accept an invite, as needed
	setInviteInfo () {
		// don't set invite type if told explicitly not to do so,
		// this is currently the case for "feedback requests on pull", where the code author is 
		// not sent an invite until the first reply to the review
		if (this.dontSetInviteType) {
			return;
		}

		// set lastInviteType, can be triggered by a review or codemark notification
		const existingLastInviteType = this.existingModel && this.existingModel.get('lastInviteType');
		const existingFirstInviteType = this.existingModel && this.existingModel.get('firstInviteType');
		if (this.inviteType) {
			this.attributes.lastInviteType = this.inviteType;
		}
		else if (this.attributes.inviteTrigger) {
			if (this.attributes.inviteTrigger.startsWith('R')) {
				this.attributes.lastInviteType = 'reviewNotification';
			}
			else if (this.attributes.inviteTrigger.startsWith('C')) {
				this.attributes.lastInviteType = 'codemarkNotification';
			}
		}
		else if (existingLastInviteType) {
			this.attributes.lastInviteType = 'reinvitation';
		}
		else if (this.team) {
			this.attributes.lastInviteType = 'invitation';
		}

		// set firstInviteType, only for new users where it hasn't yet been set
		if (this.attributes.lastInviteType && !existingFirstInviteType) {
			this.attributes.firstInviteType = this.attributes.lastInviteType;
		}
	}

	// hash the given password, as needed
	async hashPassword () {
		if (this.attributes.passwordHash) {
			delete this.attributes.password;
			return;
		}
		if (!this.attributes.password) { return; }
		this.attributes.passwordHash = await new PasswordHasher({
			errorHandler: this.errorHandler,
			password: this.attributes.password
		}).hashPassword();
		delete this.attributes.password;
	}

	// save the user to our IdP service (New Relic), as needed
	async saveToIdP () {
		// TODO: NEW_RELIC_IDP: once this is working, we no longer need to be in the business of managing
		// passwords (though we still need to be in the business of managing third-party access tokens
		// until we can push those off to client-side management)
		if (this.api.services.idp) {
			this.attributes.nrUserInfo = await this.api.services.idp.signupUser(
				{
					name: this.attributes.username,
					email: this.attributes.email,
					password: this.attributes.password
				},
				{ 
					request: this.request
				}
			);
			this.attributes.nrUserId = this.attributes.nrUserInfo.user_id;
		}
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
		if (this.request._subscriptionCheat !== this.api.config.sharedSecrets.subscriptionCheat) {
			return;
		}

		// allow unregistered users to subscribe to me-channel, needed for mock email testing
		this.api.warn(`NOTE - granting subscription permission to me channel for unregistered user ${this.model.id}, this had better be a test!`);
		await this.api.services.broadcaster.grant(
			[this.model.id],
			`user-${this.model.id}`,
			{ request: this.request }
		);
	}
}

module.exports = UserCreator;
