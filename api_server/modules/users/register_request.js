// handle the "POST /no-auth/register" request to register a new user (before confirming)

'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request.js');
var UserCreator = require('./user_creator');
var ConfirmCode = require('./confirm_code');
var Tokenizer = require('./tokenizer');
var UserPublisher = require('./user_publisher');
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

	authorize (callback) {
		// no authorization necessary ... register as you see fit!
		return callback(false);
	}

	// process the request...
	process (callback) {
		BoundAsync.series(this, [
			this.requireAndAllow,		// require certain parameters, discard unknown parameters
//			this.checkBetaCode,
			this.generateConfirmCode,	// generate a confirmation code
			this.saveUser,				// save user to database
			this.generateToken,			// generate an access token, as needed (if confirmation not required)
			this.sendEmail				// send the confirmation email with the confirmation code
		], (error) => {
			if (error) { return callback(error); }
			this.responseData = { user: this.user.getSanitizedObjectForMe() };
			if (this.confirmationCheat === this.api.config.secrets.confirmationCheat) {
				// this allows for testing without actually receiving the email
				this.log('Confirmation cheat detected, hopefully this was called by test code');
				this.responseData.user.confirmationCode = this.user.get('confirmationCode');
			}
			if (this.accessToken) {
				this.responseData.accessToken = this.accessToken;
			}
			callback();
		});
	}

	// require certain parameters, discard unknown parameters
	requireAndAllow (callback) {
		this.confirmationCheat = this.request.body._confirmationCheat;	// cheat code for testing only, return confirmation code in response
		delete this.request.body._confirmationCheat;
		this.subscriptionCheat = this.request.body._subscriptionCheat; // cheat code for testing only, allow subscription to me-channel before confirmation
		delete this.request.body._subscriptionCheat;
		this.delayEmail = this.request.body._delayEmail;				// delay sending the confirmation email, for testing
		delete this.request.body._delayEmail;
		this.requireAllowParameters(
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
			},
			callback
		);
	}

	// check that the user has a valid "beta" code (deprecated)
	checkBetaCode (callback) {
		if (
			this.request.body.betaCode !== this.api.config.api.testBetaCode &&
			!this.module.betaCodes.includes(this.request.body.betaCode)
		) {
			return callback(this.errorHandler.error('invalidBetaCode'));
		}
		delete this.request.body.betaCode;
		return callback();
	}

	// generate a confirmation code for the user, we'll send this out to them
	// in an email (or back with the request for internal testing)
	generateConfirmCode (callback) {
		if (!this.confirmationRequired) {
			this.log('Note: confirmation not required in environment - THIS SHOULD NOT BE PRODUCTION - email will be automatically confirmed');
			this.request.body.isRegistered = true;
			return callback();
		}
		// add confirmation related attributes to be saved when we save the user
		this.request.body.confirmationCode = ConfirmCode();
		this.request.body.confirmationAttempts = 0;
		let timeout = this.request.body.timeout || CONFIRMATION_CODE_TIMEOUT;
		timeout = Math.min(timeout, CONFIRMATION_CODE_TIMEOUT);
		this.request.body.confirmationCodeExpiresAt = Date.now() + timeout;
		delete this.request.body.timeout;
		process.nextTick(callback);
	}

	// save the user to the database, given the attributes in the request body
	saveUser (callback) {
		this.userCreator = new UserCreator({
			request: this,
			notOkIfExistsAndRegistered: true,	// if user exists and is already registered, this is an error
			// allow unregistered users to listen to their own me-channel, strictly for testing purposes
			subscriptionCheat: this.subscriptionCheat === this.api.config.secrets.subscriptionCheat
		});
		this.userCreator.createUser(
			this.request.body,
			(error, user) => {
				if (error) { return callback(error); }
				this.user = user;
				callback();
			}
		);
	}

	// generate an access token for the user, but only if confirmation is not required
	// (otherwise they don't get an access token yet!)
	generateToken (callback) {
		if (this.confirmationRequired) {
			return callback();
		}
		Tokenizer(
			this.user.attributes,
			this.api.config.secrets.auth,
			(error, token) => {
				if (error) {
					return callback(this.errorHandler.error('token', { reason: error }));
				}
				this.request.body.accessToken = this.accessToken = token;
				process.nextTick(callback);
			}
		);
	}

	// send out the confirmation email with the confirmation code
	sendEmail (callback) {
		if (!this.confirmationRequired) {
			return callback();
		}
		if (this.delayEmail) {
			callback();	// respond, but delay sending the email
		}
		setTimeout(() => {	// allow client to delay the email send, for testing purposes
			this.api.services.email.sendConfirmationEmail(
				{
					user: this.user,
					request: this
				},
				this.delayEmail ? () => {} : callback
			);
		}, this.delayEmail || 0);
	}

	// after a response is returned....
	postProcess (callback) {
		// new users get published to the team channel
		this.publishUserToTeams(callback);
	}

	// publish the new user to the team channel
	publishUserToTeams (callback) {
		new UserPublisher({
			user: this.user,
			data: this.user.getSanitizedObject(),
			request: this,
			messager: this.api.services.messager
		}).publishUserToTeams(callback);
	}
}

module.exports = RegisterRequest;
