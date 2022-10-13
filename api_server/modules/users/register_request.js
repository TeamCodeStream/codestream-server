// handle the "POST /no-auth/register" request to register a new user (before confirming)

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request.js');
const UserCreator = require('./user_creator');
const OldUserCreator = require('./old_user_creator'); // remove when ONE_USER_PER_ORG is fully deployed
const ConfirmCode = require('./confirm_code');
const Errors = require('./errors');
const AuthErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/authenticator/errors');
const TeamErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/teams/errors');
const NewRelicIDPErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/newrelic_idp/errors');
const Indexes = require('./indexes');
const GitLensReferralLookup = require('./gitlens_referral_lookup');
const EmailUtilities = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/email_utilities');
const WebmailCompanies = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/etc/webmail_companies');

// how long we can use the same confirmation code for
const CONFIRMATION_CODE_USABILITY_WINDOW = 60 * 60 * 1000;

class RegisterRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		// confirmation is required as part of environment settings, or forced for unit tests
		this.confirmationRequired = !this.api.config.apiServer.confirmationNotRequired || this.request.body._forceConfirmation;
		delete this.request.body._forceConfirmation;
		this.errorHandler.add(Errors);
		this.errorHandler.add(AuthErrors);
		this.errorHandler.add(TeamErrors);
		this.errorHandler.add(NewRelicIDPErrors);
	}

	async authorize () {
		// no authorization necessary ... register as you see fit!

		// but let's deprecate some behavior...
		if (this.request.body.teamId || this.request.body.repoId) {
			throw this.errorHandler.error('deprecated', { reason: 'repo-based signup is deprecated' });
		} else if (this.request.body.inviteCode) {
			throw this.errorHandler.error('deprecated', { reason: 'invite codes are deprecated' });
		}
	}

	// process the request...
	async process () {
		await this.requireAndAllow();		// require certain parameters, discard unknown parameters
		await this.checkWebmail();			// check for webmail address, as needed
		if (await this.getExistingUser()) {		// get the existing user matching this email, if any
			return; // short-circuit the flow, for an already registered user
		} 
		await this.generateConfirmCode();	// generate a confirmation code, as requested
		await this.lookForGitLensReferral(); /// match against any GitLens referral, as needed
		await this.saveUser();				// save user to database
		await this.saveSignupToken();		// save the signup token so we can identify this user with an IDE session
	}

	// require certain parameters, discard unknown parameters
	async requireAndAllow () {
		// many attributes that are allowed but don't become attributes of the created user
		[
			'_confirmationCheat',
			'_subscriptionCheat',
			'_delayEmail',
			'expiresIn',
			'signupToken',
			'machineId',
			'checkForWebmail'
		].forEach(parameter => {
			this[parameter] = this.request.body[parameter];
			delete this.request.body[parameter];
		});

		await this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['email', 'password', 'username']
				},
				optional: {
					string: ['fullName', 'timeZone', 'companyName', '_pubnubUuid'],
					number: ['timeout', 'reuseTimeout'],
					object: ['preferences']
				}
			}
		);

		this.request.body.email = this.request.body.email.trim();
	}

	// check for a webmail email address if requested, and return an error code if the
	// email is indeed a webmail
	async checkWebmail () {
		if (!this.checkForWebmail) { return; }

		const parsed = EmailUtilities.parseEmail(this.request.body.email);
		if (typeof parsed === 'string') {
			throw this.errorHandler.error('validation', { email: parsed });
		}

		if (WebmailCompanies.includes(parsed.domain.toLowerCase())) {
			throw this.errorHandler.error('emailIsWebmail');
		}
	}

	// get the existing user matching this email, if any
	async getExistingUser () {
		// find any registered user (which triggers an already-registered email),
		// or any unregistered user that has not been invited to a team
		const matchingUsers = await this.data.users.getByQuery(
			{ searchableEmail: this.request.body.email.toLowerCase() },
			{ hint: Indexes.bySearchableEmail }
		);

		let uninvitedUser;
		this.user = matchingUsers.find(user => {
			if (user.get('deactivated')) {
				return false;
			} else if (user.get('isRegistered')) {
				return true;
			} else if ((user.get('teamIds') || []).length === 0) {
				uninvitedUser = user;
			}
		});
		this.user = this.user || uninvitedUser;

		// short-circuit the flow if the user is already registered
		return this.user && this.user.get('isRegistered');
	}

	// generate a confirmation code for the user, we'll send this out to them
	// in an email (or back with the request for internal testing)
	async generateConfirmCode () {
		if (!this.confirmationRequired) {
			this.log('Note: confirmation not required in environment - THIS SHOULD NOT BE PRODUCTION - email will be automatically confirmed');
			this.request.body.isRegistered = true;
			return;
		}

		// add confirmation related attributes to be saved when we save the user
		if (
			!this.user ||
			!this.user.get('confirmationCode') ||
			!this.user.get('confirmationCodeUsableUntil') ||
			Date.now() >= this.user.get('confirmationCodeUsableUntil')
		) {
			this.request.body.confirmationCode = ConfirmCode();
			let timeout = this.request.body.timeout || this.api.config.apiServer.confirmCodeExpiration;
			timeout = Math.min(timeout, this.api.config.apiServer.confirmCodeExpiration);
			this.request.body.confirmationCodeExpiresAt = Date.now() + timeout;
			let reuseTimeout = this.request.body.reuseTimeout || CONFIRMATION_CODE_USABILITY_WINDOW;
			reuseTimeout = Math.min(reuseTimeout, CONFIRMATION_CODE_USABILITY_WINDOW);
			this.request.body.confirmationCodeUsableUntil = Date.now() + reuseTimeout;
		}
		delete this.request.body.timeout;
		delete this.request.body.reuseTimeout;
		this.request.body.confirmationAttempts = 0;
	}

	// match this signup against any GitLens referral, as needed
	async lookForGitLensReferral () {
		if (await GitLensReferralLookup(this.api.data, this.request.body.email, this.machineId)) {
			this.request.body.source = 'GitLens';
		}
	}

	// save the user to the database, given the attributes in the request body
	async saveUser () {
		if (this.request.body.signupToken) {
			// this doesn't get saved with the user
			this.signupToken = this.request.body.signupToken;
			delete this.request.body.signupToken;	
		}

		// remove this check when ONE_USER_PER_ORG is fully deployed
		const oneUserPerOrg = this.module.oneUserPerOrg || this.request.headers['x-cs-one-user-per-org'];
		if (oneUserPerOrg) {
			this.log('NOTE: Creating user under one-user-per-org paradigm');
			this.user = await new UserCreator({ 
				request: this,
				existingUser: this.user
			}).createUser(this.request.body);
		} else {
			this.userCreator = new OldUserCreator({
				request: this,
				teamIds: this.team ? [this.team.id] : undefined,
				companyIds: this.team ? [this.team.get('companyId')] : undefined,
				userBeingAddedToTeamId: this.team ? this.team.id : undefined,
				dontSetInviteCode: true // suppress the default behavior for creating a user on a team
			});
			this.user = await this.userCreator.createUser(this.request.body);
		}
	}

	// if a signup token is provided, this allows a client IDE session to identify the user ID that was eventually
	// signed up as it originated from the IDE
	async saveSignupToken () {
		if (!this.signupToken) {
			return;
		}
		return this.api.services.signupTokens.insert(
			this.signupToken,
			this.user.id,
			{ 
				requestId: this.request.id,
				expiresIn: this.expiresIn
			}
		);
	}

	// handle the response to the request
	async handleResponse () {
		if (this.gotError) {
			return super.handleResponse();
		}

		// we only return the user info if the user was not already registered, or for test running
		if (!this.user.get('isRegistered') || this.user.get('_forTesting')) {
			this.responseData = { user: this.user.getSanitizedObjectForMe({ request: this }) };
			if (this._confirmationCheat === this.api.config.sharedSecrets.confirmationCheat) {
				// this allows for testing without actually receiving the email
				this.log('Confirmation cheat detected, hopefully this was called by test code');
				this.responseData.user.confirmationCode = this.user.get('confirmationCode');
			}
		}

		return super.handleResponse();
	}

	// after a response is returned....
	async postProcess () {
		// send the confirmation email with the confirmation code,
		// or an already-registered email if the user is already registered
		return this.sendEmail();
	}

	// send out the confirmation email with the confirmation code
	// or an already-registered email if the user is already registered
	async sendEmail () {
		if (!this.confirmationRequired) {
			return;
		}

		// delay the email if requested, used by test code
		if (this._delayEmail) {
			setTimeout(this.sendEmail.bind(this), this._delayEmail);
			delete this._delayEmail;
			return;
		}

		// if the user is already registered, we send an email to this effect, rather
		// than sending the confirmation code
		if (this.user && this.user.get('isRegistered')) {
			this.log(`Triggering already-registered email to ${this.user.get('email')}...`);
			await this.api.services.email.queueEmailSend(
				{
					type: 'alreadyRegistered',
					userId: this.user.id
				},
				{
					request: this,
					user: this.user
				}
			);
		}

		// othwerwise send a confirmation email with a confirmation code 
		else {
			this.log(`Triggering confirmation email with confirmation code to ${this.user.get('email')}...`);
			await this.api.services.email.queueEmailSend(
				{
					type: 'confirm',
					userId: this.user.id
				},
				{
					request: this,
					user: this.user
				}
			);
		}
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'register',
			summary: 'Registers a user',
			access: 'No authorization needed',
			description: 'Registers a user and sends out a confirmation email (user is not fully registered until they have confirmed); this will create a new user record if a user with that email doesn\'t already exist, or it will return the user record for a user if a user with that email does exist and is not yet confirmed.',
			input: {
				summary: 'Specify attributes in the body',
				looksLike: {
					'email*': '<User\'s email>',
					'password*': '<User\'s password>',
					'username*': '<User\'s username, must be unique for any team they are on>',
					'fullName': '<User\'s full name>',
					'timeZone': '<User\'s time zone, per the Time Zone Database>',
					'preferences': '<Object representing any preferences the user wants to set as they register>',
					'signupToken': '<Client-generated signup token, passed to signup on the web, to associate an IDE session with the new user>',
				}
			},
			returns: {
				summary: 'Returns a user object',
				looksLike: {
					user: '<@@#user object#user@@>'
				}
			},
			errors: [
				'parameterRequired',
				'validation'
			]
		};
	}
}

module.exports = RegisterRequest;
