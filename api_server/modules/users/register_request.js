// handle the "POST /no-auth/register" request to register a new user (before confirming)

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request.js');
const UserCreator = require('./user_creator');
const ConfirmCode = require('./confirm_code');
const UserPublisher = require('./user_publisher');
const Errors = require('./errors');

const CONFIRMATION_CODE_TIMEOUT = 7 * 24 * 60 * 60 * 1000;	// confirmation code expires after a week

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
		await this.generateConfirmCode();	// generate a confirmation code
		await this.saveUser();				// save user to database
		await this.generateToken();			// generate an access token, as needed (if confirmation not required)
		await this.sendEmail();				// send the confirmation email with the confirmation code
		await this.formResponse();			// form the response to the request
	}

	// require certain parameters, discard unknown parameters
	async requireAndAllow () {
		this.confirmationCheat = this.request.body._confirmationCheat;	// cheat code for testing only, return confirmation code in response
		delete this.request.body._confirmationCheat;
		this.subscriptionCheat = this.request.body._subscriptionCheat; // cheat code for testing only, allow subscription to me-channel before confirmation
		delete this.request.body._subscriptionCheat;
		this.delayEmail = this.request.body._delayEmail;				// delay sending the confirmation email, for testing
		delete this.request.body._delayEmail;
		await this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['email', 'password', 'username']
				},
				optional: {
					string: ['firstName', 'lastName', '_pubnubUuid'],
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
		// add confirmation related attributes to be saved when we save the user
		this.request.body.confirmationCode = ConfirmCode();
		this.request.body.confirmationAttempts = 0;
		let timeout = this.request.body.timeout || CONFIRMATION_CODE_TIMEOUT;
		timeout = Math.min(timeout, CONFIRMATION_CODE_TIMEOUT);
		this.request.body.confirmationCodeExpiresAt = Date.now() + timeout;
		delete this.request.body.timeout;
	}

	// save the user to the database, given the attributes in the request body
	async saveUser () {
		// from the web client, don't return an error if the user is already registered, to avoid email harvesting
		const notOkIfExistsAndRegistered = (this.request.headers['x-cs-plugin-ide'] || '').toLowerCase() !== 'webclient';
		this.userCreator = new UserCreator({
			request: this,
			notOkIfExistsAndRegistered,	
			// allow unregistered users to listen to their own me-channel, strictly for testing purposes
			subscriptionCheat: this.subscriptionCheat === this.api.config.secrets.subscriptionCheat
		});
		this.user = await this.userCreator.createUser(this.request.body);
	}

	// generate an access token for the user, but only if confirmation is not required
	// (otherwise they don't get an access token yet!)
	async generateToken () {
		if (this.confirmationRequired || (this.userCreator.didExist && this.user.get('isRegistered'))) {
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

	// send out the confirmation email with the confirmation code
	async sendEmail () {
		if (!this.confirmationRequired) {
			return;
		}
		if (this.delayEmail) {
			setTimeout(this.sendEmail.bind(this), this.delayEmail);
			delete this.delayEmail;
			return;
		}
		// if the user is already registered, we send an email to this effect, rather
		// than sending the confirmation code
		if (this.userCreator.didExist && this.user.get('isRegistered')) {
			await this.api.services.email.sendAlreadyRegisteredEmail(
				{
					user: this.user,
					request: this
				}
			);
		}
		else {
			await this.api.services.email.sendConfirmationEmail(
				{
					user: this.user,
					request: this
				}
			);
		}
	}

	// form the response to the request
	async formResponse () {
		// FIXME - we eventually need to deprecate serving the user object completely,
		// this is a security vulnerability
		if (!this.user.get('isRegistered') || this.user.get('_forTesting')) {
			this.responseData = { user: this.user.getSanitizedObjectForMe() };
			if (this.confirmationCheat === this.api.config.secrets.confirmationCheat) {
				// this allows for testing without actually receiving the email
				this.log('Confirmation cheat detected, hopefully this was called by test code');
				this.responseData.user.confirmationCode = this.user.get('confirmationCode');
			}
		}
		if (this.accessToken) {
			this.responseData.accessToken = this.accessToken;
		}
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
			data: this.user.getSanitizedObject(),
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
					'firstName': '<User\'s first name>',
					'lastName': '<User\'s last name>',
					'secondaryEmails': '<Array of other emails the user wants to associate with their account>',
					'preferences': '<Object representing any preferences the user wants to set as they register>'
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
