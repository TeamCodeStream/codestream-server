// handle the "POST /no-auth/register" request to register a new user (before confirming)

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request.js');
const UserCreator = require('./user_creator');
const ConfirmCode = require('./confirm_code');
const UserPublisher = require('./user_publisher');
const Errors = require('./errors');

class RegisterRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		// confirmation is required as part of environment settings, or forced for unit tests
		this.confirmationRequired = !this.api.config.api.confirmationNotRequired || this.request.body._forceConfirmation;
		delete this.request.body._forceConfirmation;
		this.errorHandler.add(Errors);
	}

	async authorize () {
		// no authorization necessary ... register as you see fit!
	}

	// process the request...
	async process () {
		await this.requireAndAllow();		// require certain parameters, discard unknown parameters
		await this.generateConfirmCode();	// generate a confirmation code, as requested
		await this.saveUser();				// save user to database
		await this.generateLinkToken();		// generate a token for the confirm link, as requested
		await this.saveTokenInfo();			// save the token info to the user object, if we're doing a confirm link
		await this.generateAccessToken();	// generate an access token, as needed (if confirmation not required)
		await this.saveSignupToken();		// save the signup token so we can identify this user with an IDE session
		await this.sendEmail();				// send the confirmation email with the confirmation code
	}

	// require certain parameters, discard unknown parameters
	async requireAndAllow () {
		// many attributes that are allowed but don't become attributes of the created user
		['_confirmationCheat', '_subscriptionCheat', '_delayEmail', 'wantLink', 'expiresIn', 'signupToken'].forEach(parameter => {
			this[parameter] = this.request.body[parameter];
			delete this.request.body[parameter];
		});

		// backward compatibility with first/last name, turn it into a full name
		if (!this.request.body.fullName && (this.request.body.firstName || this.request.body.lastName)) {
			this.request.body.fullName = `${this.request.body.firstName || ''} ${this.request.body.lastName || ''}`.trim();
		}

		await this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['email', 'password', 'username']
				},
				optional: {
					string: ['fullName', 'firstName', 'lastName', 'timeZone', '_pubnubUuid'],	// first/last name should be deprecated once original atom client is deprecated
					number: ['timeout'],
					'array(string)': ['secondaryEmails'],
					object: ['preferences']
				}
			}
		);
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
		this.request.body.confirmationCode = ConfirmCode();
		this.request.body.confirmationAttempts = 0;
		let timeout = this.request.body.timeout || this.api.config.api.confirmCodeExpiration;
		timeout = Math.min(timeout, this.api.config.api.confirmCodeExpiration);
		this.request.body.confirmationCodeExpiresAt = Date.now() + timeout;
		delete this.request.body.timeout;
	}

	// save the user to the database, given the attributes in the request body
	async saveUser () {
		if (this.request.body.signupToken) {
			// this doesn't get saved with the user
			this.signupToken = this.request.body.signupToken;
			delete this.request.body.signupToken;	
		}
		this.userCreator = new UserCreator({
			request: this,
			// allow unregistered users to listen to their own me-channel, strictly for testing purposes
			subscriptionCheat: this._subscriptionCheat === this.api.config.secrets.subscriptionCheat
		});
		this.user = await this.userCreator.createUser(this.request.body);
	}

	// generate a token for the confirm link, if the client wants an email with a link rather than a code
	async generateLinkToken () {
		if (!this.wantLink) {
			return;	// only if the client wants an email with a link, for now
		}
		// time till expiration can be provided (normally for testing purposes),
		// or default to configuration
		let expiresIn = this.api.config.api.confirmationExpiration;
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

	// generate an access token for the user, but only if confirmation is not required
	// (otherwise they don't get an access token yet!)
	async generateAccessToken () {
		if (this.confirmationRequired || (this.userCreator.existingModel && this.user.get('isRegistered'))) {
			return;
		}
		let token, minIssuance;
		try {
			token = this.api.services.tokenHandler.generate({ uid: this.user.id });
			minIssuance = this.api.services.tokenHandler.decode(token).iat * 1000;
		}
		catch (error) {
			const message = typeof error === 'object' ? error.message : error;
			throw this.errorHandler.error('token', { reason: message });
		}
		this.accessToken = token;
		this.request.body.accessTokens = { 
			web: {
				token,
				minIssuance: minIssuance
			}
		};
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

	// send out the confirmation email with the confirmation code
	async sendEmail () {
		if (!this.confirmationRequired) {
			return;
		}
		if (this._delayEmail) {
			setTimeout(this.sendEmail.bind(this), this._delayEmail);
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
		// (soon to be the only way we'll do it), send that...
		else if (this.wantLink) {

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
		}

		// othwerwise we're sending an old-style confirmation email with a 
		// confirmation code (soon to be deprecated)
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

	// handle the response to the request
	async handleResponse () {
		if (this.gotError) {
			return await super.handleResponse();
		}
		// need to refetch the user, since it may have changed, this should fetch from cache, not database
		this.user = await this.data.users.getById(this.user.id);
		// FIXME - we eventually need to deprecate serving the user object completely,
		// this is a security vulnerability
		if (!this.user.get('isRegistered') || this.user.get('_forTesting')) {
			this.responseData = { user: this.user.getSanitizedObjectForMe({ request: this }) };
			if (this._confirmationCheat === this.api.config.secrets.confirmationCheat) {
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
	}

	// publish the new user to the team channel
	async publishUserToTeams () {
		await new UserPublisher({
			user: this.user,
			data: this.user.getSanitizedObject({ request: this }),
			request: this,
			messager: this.api.services.messager
		}).publishUserToTeams();
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
					'signupToken': '<Client-generated signup token, passed to signup on the web, to associate an IDE session with the new user>'
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
				'validation'
			]
		};
	}
}

module.exports = RegisterRequest;
