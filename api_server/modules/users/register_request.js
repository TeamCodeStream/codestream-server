'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request.js');
var UserCreator = require('./user_creator');
var ConfirmCode = require('./confirm_code');
var Tokenizer = require('./tokenizer');
var UserPublisher = require('./user_publisher');
const Errors = require('./errors');

const CONFIRMATION_CODE_TIMEOUT = 7 * 24 * 60 * 60 * 1000;

class RegisterRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.confirmationRequired = !this.api.config.api.confirmationNotRequired || this.request.body._forceConfirmation;
		delete this.request.body._forceConfirmation;
		this.errorHandler.add(Errors);
	}

	authorize (callback) {
		return callback(false);
	}

	process (callback) {
		BoundAsync.series(this, [
			this.requireAndAllow,
			this.checkBetaCode,
			this.generateConfirmCode,
			this.saveUser,
			this.generateToken,
			this.sendEmail
		], (error) => {
			if (error) { return callback(error); }
			this.responseData = { user: this.user.getSanitizedObject() };
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
					string: ['email', 'password', 'username', 'betaCode']
				},
				optional: {
					string: ['firstName', 'lastName'],
					number: ['timeout'],
					'array(string)': ['secondaryEmails']
				}
			},
			callback
		);
	}

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

	generateConfirmCode (callback) {
		if (!this.confirmationRequired) {
			this.log('Note: confirmation not required in environment - THIS SHOULD NOT BE PRODUCTION - email will be automatically confirmed');
			this.request.body.isRegistered = true;
			return callback();
		}
		this.request.body.confirmationCode = ConfirmCode();
		this.request.body.confirmationAttempts = 0;
		let timeout = this.request.body.timeout || CONFIRMATION_CODE_TIMEOUT;
		timeout = Math.min(timeout, CONFIRMATION_CODE_TIMEOUT);
		this.request.body.confirmationCodeExpiresAt = Date.now() + timeout;
		delete this.request.body.timeout;
		process.nextTick(callback);
	}

	saveUser (callback) {
		this.userCreator = new UserCreator({
			request: this,
			notOkIfExistsAndRegistered: true,
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

	postProcess (callback) {
		this.publishUserToTeams(callback);
	}

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
