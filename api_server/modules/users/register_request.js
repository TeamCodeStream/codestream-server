// handle the "POST /no-auth/register" request to register a new user (before confirming)

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request.js');
const UserCreator = require('./user_creator');
const ConfirmCode = require('./confirm_code');
const Tokenizer = require('./tokenizer');
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
		this.userCreator = new UserCreator({
			request: this,
			notOkIfExistsAndRegistered: true,	// if user exists and is already registered, this is an error
			// allow unregistered users to listen to their own me-channel, strictly for testing purposes
			subscriptionCheat: this.subscriptionCheat === this.api.config.secrets.subscriptionCheat
		});
		this.user = await this.userCreator.createUser(this.request.body);
	}

	// generate an access token for the user, but only if confirmation is not required
	// (otherwise they don't get an access token yet!)
	async generateToken () {
		if (this.confirmationRequired) {
			return;
		}
		let token;
		try {
			token = Tokenizer(
				this.user.attributes,
				this.api.config.secrets.auth
			);
		}
		catch (error) {
			const message = typeof error === 'object' ? error.message : error;
			throw this.errorHandler.error('token', { reason: message });
		}
		this.request.body.accessToken = this.accessToken = token;
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
		await this.api.services.email.sendConfirmationEmail(
			{
				user: this.user,
				request: this
			}
		);
	}

	// form the response to the request
	async formResponse () {
		this.responseData = { user: this.user.getSanitizedObjectForMe() };
		if (this.confirmationCheat === this.api.config.secrets.confirmationCheat) {
			// this allows for testing without actually receiving the email
			this.log('Confirmation cheat detected, hopefully this was called by test code');
			this.responseData.user.confirmationCode = this.user.get('confirmationCode');
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
}

module.exports = RegisterRequest;
