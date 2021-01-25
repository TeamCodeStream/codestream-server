// handle the "POST /no-auth/register" request to register a new user (before confirming)

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request.js');
const UserCreator = require('./user_creator');
const ConfirmCode = require('./confirm_code');
const UserPublisher = require('./user_publisher');
const Errors = require('./errors');
const AuthErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/authenticator/errors');
const TeamErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/teams/errors');
const Indexes = require('./indexes');
const ConfirmHelper = require('./confirm_helper');
const AddTeamMembers = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/teams/add_team_members');
const ConfirmRepoSignup = require('./confirm_repo_signup');
const GitLensReferralLookup = require('./gitlens_referral_lookup');

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
	}

	async authorize () {
		// no authorization necessary ... register as you see fit!
	}

	// process the request...
	async process () {
		await this.requireAndAllow();		// require certain parameters, discard unknown parameters
		await this.confirmRepoSignup();		// for signup by virtue of access to a repo, confirm this is allowed
		await this.getInvitedUser();		// get the user associated with an invite code, as needed
		await this.getExistingUser();		// get the existing user matching this email, if any
		if (await this.doLogin()) {			// under some circumstances, confirmation is not necessary,
			return;							// and we just log the user in
		}
		await this.generateConfirmCode();	// generate a confirmation code, as requested
		await this.lookForGitLensReferral(); /// match against any GitLens referral, as needed
		await this.saveUser();				// save user to database
		await this.addUserToTeam();			// add the user to a team, as needed
		await this.generateLinkToken();		// generate a token for the confirm link, as requested
		await this.saveTokenInfo();			// save the token info to the user object, if we're doing a confirm link
		await this.saveSignupToken();		// save the signup token so we can identify this user with an IDE session

		// if confirmation is not required (for instance, on-prem without email), skip straight to login
		if (!this.confirmationRequired) {
			await this.doUnconfirmedLogin();
		}
	}

	// require certain parameters, discard unknown parameters
	async requireAndAllow () {
		// many attributes that are allowed but don't become attributes of the created user
		[
			'_confirmationCheat',
			'_subscriptionCheat',
			'_delayEmail',
			'wantLink',
			'expiresIn',
			'signupToken',
			'inviteCode',
			'teamId',
			'repoId',
			'commitHash',
			'machineId'
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
					'array(string)': ['secondaryEmails'],
					object: ['preferences']
				}
			}
		);

		this.request.body.email = this.request.body.email.trim();
	}

	// for signup by virtue of access to a repo, confirm this is allowed
	async confirmRepoSignup() {
		const info = await ConfirmRepoSignup({
			teamId: this.teamId,
			repoId: this.repoId,
			commitHash: this.commitHash,
			request: this
		});
		Object.assign(this, info);
	}

	// get the user associated with an invite code, as needed
	async getInvitedUser () {
		if (!this.inviteCode) {
			return;
		}
		const info = await this.api.services.signupTokens.find(
			this.inviteCode,
			{ requestId: this.request.id }
		);
		if (!info) {
			return;
		}
		else if (info.expired) {
			throw this.errorHandler.error('tokenExpired');
		}
		this.invitedUser = await this.data.users.getById(info.userId);
	}

	// get the existing user matching this email, if any
	async getExistingUser () {
		this.user = await this.data.users.getOneByQuery(
			{ searchableEmail: this.request.body.email.toLowerCase() },
			{ hint: Indexes.bySearchableEmail }
		);
	}

	// under some circumstances, we allow the user to skip confirmation and go right to login
	async doLogin () {
		// email confirmation is not required if the user was invited, and they are registering with the same
		// email that the invite was sent to
		this.invitedUserWithSameEmail = this.invitedUser && 
			this.invitedUser.get('email').toLowerCase() === this.request.body.email.toLowerCase();
		if (!this.invitedUserWithSameEmail) {
			return;
		}

		this.responseData = await new ConfirmHelper({
			request: this,
			user: this.invitedUser
		}).confirm(this.request.body);
		this.api.services.signupTokens.removeInviteCodesByUserId(this.invitedUser.id);
		this.userLoggedIn = true;
		return true;
	}

	// generate a confirmation code for the user, we'll send this out to them
	// in an email (or back with the request for internal testing)
	async generateConfirmCode () {
		if (!this.confirmationRequired) {
			this.log('Note: confirmation not required in environment - THIS SHOULD NOT BE PRODUCTION - email will be automatically confirmed');
			this.request.body.isRegistered = true;
			return;
		}
		if (this.wantLink) {
			return;	// new-style confirmation emails with links rather than confirmation codes, so skip this
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

		// have to deal with a little weirdness here ... if we get an invite code, and the invite code references
		// a user that already exists, and they don't match the email the user is trying to register with,
		// we will effectively change the invited user's email to the user they are registered with ... but we
		// can't allow this if the invited user is already registered (which shouldn't happen in theory), or if the
		// email the user is trying to register with already belongs to another invited user
		let existingUser;
		if (this.invitedUser && this.invitedUser.get('email').toLowerCase() !== this.request.body.email.toLowerCase()) {
			if (this.invitedUser.get('isRegistered')) {
				throw this.errorHandler.error('alreadyAccepted');
			}
			else if (this.user) {
				throw this.errorHandler.error('inviteMismatch');
			}
			else {
				existingUser = this.invitedUser;
			}
		}

		this.userCreator = new UserCreator({
			request: this,
			teamIds: this.team ? [this.team.id] : undefined,
			userBeingAddedToTeamId: this.team ? this.team.id : undefined,
			// allow unregistered users to listen to their own me-channel, strictly for testing purposes
			subscriptionCheat: this._subscriptionCheat === this.api.config.sharedSecrets.subscriptionCheat,
			existingUser,	// triggers finding the existing user at a different email than the one being registered
			dontSetInviteCode: true // suppress the default behavior for creating a user on a team
		});
		this.user = await this.userCreator.createUser(this.request.body);
	}

	// add the created user to the team indicated, for signup-by-repo
	async addUserToTeam() {
		if (!this.team) return;

		await new AddTeamMembers({
			request: this,
			addUsers: [this.user],
			team: this.team,
			subscriptionCheat: this._subscriptionCheat // allows unregistered users to subscribe to me-channel, needed for mock email testing
		}).addTeamMembers();

		// refetch the user since they changed when added to team
		this.user = await this.data.users.getById(this.user.id);
	}

	// generate a token for the confirm link, if the client wants an email with a link rather than a code
	async generateLinkToken () {
		if (!this.wantLink) {
			return;	// only if the client wants an email with a link, for now
		}
		// time till expiration can be provided (normally for testing purposes),
		// or default to configuration
		let expiresIn = this.api.config.apiServer.confirmationExpiration;
		if (this.expiresIn && this.expiresIn < expiresIn) {
			this.warn('Overriding configured confirmation expiration to ' + this.expiresIn);
			expiresIn = this.expiresIn;
		}
		const expiresAt = Date.now() + expiresIn;
		this.token = this.api.services.tokenHandler.generate(
			{ uid: this.user.id },
			'conf',
			{ expiresAt }
		);
		this.minIssuance = this.api.services.tokenHandler.decode(this.token).iat * 1000;
	}

	// save the token info in the database, note that we don't save the actual token, just the notion
	// that all confirmation tokens issued previous to this one are no longer valid
	async saveTokenInfo () {
		if (!this.wantLink) {
			return;	// only if the client wants an email with a link, for now
		}
		const op = {
			'$set': {
				'accessTokens.conf': {
					minIssuance: this.minIssuance
				}
			}
		};
		await this.data.users.applyOpById(this.user.id, op);
	}

	// if a signup token is provided, this allows a client IDE session to identify the user ID that was eventually
	// signed up as it originated from the IDE
	async saveSignupToken () {
		if (!this.signupToken) {
			return;
		}
		await this.api.services.signupTokens.insert(
			this.signupToken,
			this.user.id,
			{ 
				requestId: this.request.id,
				expiresIn: this.expiresIn
			}
		);
	}

	// if email confirmation is not required, we go right to login
	async doUnconfirmedLogin () {
		this.responseData = await new ConfirmHelper({
			request: this,
			user: this.user
		}).confirm(this.request.body);
		this.userLoggedIn = true;
		return true;
	}

	// handle the response to the request
	async handleResponse () {
		if (this.gotError || this.userLoggedIn) {
			return await super.handleResponse();
		}
		// need to refetch the user, since it may have changed, this should fetch from cache, not database
		this.user = await this.data.users.getById(this.user.id);
		if (!this.user.get('isRegistered') || this.user.get('_forTesting')) {
			this.responseData = { user: this.user.getSanitizedObjectForMe({ request: this }) };
			if (this._confirmationCheat === this.api.config.sharedSecrets.confirmationCheat) {
				// this allows for testing without actually receiving the email
				this.log('Confirmation cheat detected, hopefully this was called by test code');
				this.responseData.user.confirmationCode = this.user.get('confirmationCode');
				this.responseData.user.confirmationToken = this.token;
			}
		}
		if (this.accessToken) {
			this.responseData.accessToken = this.accessToken;
		}
		await super.handleResponse();
	}

	// after a response is returned....
	async postProcess () {
		// new users get published to the team channel
		await this.publishUserToTeams();

		// remove invite code from the registered user, and as a saved signup token
		await this.removeInviteCode();

		// send the confirmation email with the confirmation code
		await this.sendConfirmationEmail();
	}

	// publish the new user to the team channel
	async publishUserToTeams () {
		await new UserPublisher({
			user: this.user,
			data: this.user.getSanitizedObject({ request: this }),
			request: this,
			broadcaster: this.api.services.broadcaster
		}).publishUserToTeams();
	}

	// if the user registered using an invite code, invalidate the invite code by removing it from
	// the user object and as a saved signup token
	async removeInviteCode () {
		if (!this.invitedUser) { return; }
		await this.data.users.updateDirect(
			{ id: this.data.users.objectIdSafe(this.invitedUser.id) },
			{ $unset: { inviteCode: true, externalUserId: true } }
		);
		await this.api.services.signupTokens.remove(this.inviteCode);
	}

	// send out the confirmation email with the confirmation code
	async sendConfirmationEmail () {
		if (!this.confirmationRequired || this.invitedUserWithSameEmail) {
			return;
		}
		if (this._delayEmail) {
			setTimeout(this.sendConfirmationEmail.bind(this), this._delayEmail);
			delete this._delayEmail;
			return;
		}

		// if the user is already registered, we send an email to this effect, rather
		// than sending the confirmation code
		if (this.userCreator.existingModel && this.user.get('isRegistered')) {
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

		// otherwise if the client wants a confirmation email with a link
		// (soon to be deprecated), send that...
		else if (this.wantLink) {
			// CONFIRMATION EMAILS WITH LINKS TO THE OLD WEB APP ARE NOW DEPRECATED
			throw 'deprecated';
			/*
			// generate the url and queue the email send with the outbound email service
			const host = this.api.config.webclient.host;
			const url = `${host}/confirm-email/${encodeURIComponent(this.token)}`;
			this.log(`Triggering confirmation email to ${this.user.get('email')}...`);
			await this.api.services.email.queueEmailSend(
				{
					type: 'confirm',
					userId: this.user.id,
					url
				},
				{
					request: this,
					user: this.user
				}
			);
			*/
		}

		// othwerwise we're sending an old-style (and now new-style) confirmation email with a 
		// confirmation code 
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
					'secondaryEmails': '<Array of other emails the user wants to associate with their account>',
					'preferences': '<Object representing any preferences the user wants to set as they register>',
					'wantLink': '<Set this to send a confirmation email with a link instead of a code>',
					'signupToken': '<Client-generated signup token, passed to signup on the web, to associate an IDE session with the new user>',
					'inviteCode': '<Invite code associated with an invitation to this user>',
					'teamId': '<For repo-based signup, specify team the user is joining>',
					'repoId': '<For repo-based signup, a repo owned by the team must be passed>',
					'commitHash': '<For repo-based signup, a commit hash known for that repo must be passed>'
				}
			},
			returns: {
				summary: 'Returns a user object',
				looksLike: {
					user: '<@@#user object#user@@>'
				}
			},
			publishes: {
				summary: 'If the user is already on any teams, an updated user object will be published to the team channel for each team the user is on, in case some user attributes are changed by the register call.',
				looksLike: {
					user: '<@@#user object#user@@>'
				}
			},
			errors: [
				'parameterRequired',
				'usernameNotUnique',
				'exists',
				'validation',
				'inviteMismatch',
				'alreadyAccepted',
				'notFound',
				'createAuth'
			]
		};
	}
}

module.exports = RegisterRequest;
