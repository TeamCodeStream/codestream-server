'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request.js');
var Tokenizer = require('./tokenizer');
var PasswordHasher = require('./password_hasher');
var UserSubscriptionGranter = require('./user_subscription_granter');
var UserPublisher = require('./user_publisher');

const Errors = require('./errors');

const MAX_CONFIRMATION_ATTEMPTS = 3;

class ConfirmRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(Errors);
	}

	authorize (callback) {
		return callback(false);
	}

	process (callback) {
		BoundAsync.series(this, [
			this.allow,
			this.require,
			this.getUser,
			this.checkAttributes,
			this.verifyCode,
			this.hashPassword,
			this.updateUser,
			this.generateToken,
			this.grantSubscriptionPermissions,
			this.formResponse
		], callback);
	}

	allow (callback) {
		this.allowParameters(
			'body',
			{
				string: ['userId', 'email', 'confirmationCode', 'password', 'username']
			},
			callback
		);
	}

	require (callback) {
		this.requireParameters(
			'body',
			['userId', 'email', 'confirmationCode'],
			callback
		);
	}

	getUser (callback) {
		this.data.users.getById(
			this.request.body.userId,
			(error, user) => {
				if (error) { return callback(error); }
				this.user = user;
				callback();
			}
		);
	}

	checkAttributes (callback) {
		if (!this.user || this.user.get('deactivated')) {
			return callback(this.errorHandler.error('notFound', { info: 'userId' }));
		}
		if (this.user.get('searchableEmail') !== this.request.body.email.toLowerCase()) {
			return callback(this.errorHandler.error('emailMismatch'));
		}
		if (this.user.get('isRegistered')) {
			return callback(this.errorHandler.error('alreadyRegistered'));
		}
		if (!this.user.get('passwordHash') && !this.request.body.password) {
			return callback(this.errorHandler.error('parameterRequired', { info: 'password' }));
		}
		if (!this.user.get('username') && !this.request.body.username) {
			return callback(this.errorHandler.error('parameterRequired', { info: 'username' }));
		}
		process.nextTick(callback);
	}

	verifyCode (callback) {
		if (this.request.body.confirmationCode !== this.user.get('confirmationCode')) {
			this.confirmationFailed = true;
			if (this.user.get('confirmationAttempts') === MAX_CONFIRMATION_ATTEMPTS) {
				this.maxConfirmationAttempts = true;
			}
		}
		else if (Date.now() > this.user.get('confirmationCodeExpiresAt')) {
			this.confirmationFailed = true;
			this.confirmationExpired = true;
		}
		process.nextTick(callback);
	}

	hashPassword (callback) {
		if (!this.request.body.password) { return callback(); }
		new PasswordHasher({
			errorHandler: this.errorHandler,
			password: this.request.body.password
		}).hashPassword((error, passwordHash) => {
			if (error) { return callback(error); }
			this.request.body.passwordHash = passwordHash;
			delete this.request.body.password;
			process.nextTick(callback);
		});
	}

	updateUser (callback) {
		if (this.confirmationFailed) {
			this.updateUserConfirmationFailed(callback);
		}
		else {
			this.updateUserConfirmationSuccess(callback);
		}
	}

	updateUserConfirmationFailed (callback) {
		let set = {};
		if (this.maxConfirmationAttempts || this.confirmationExpired) {
			set.confirmationCode = null;
			set.confirmationAttempts = 0;
			set.confirmationCodeExpiresAt = null;
		}
		else {
			set.confirmationAttempts = this.user.get('confirmationAttempts') + 1;
		}
		this.data.users.updateDirect(
			{ _id: this.data.users.objectIdSafe(this.request.body.userId) },
			{ $set: set },
			callback
		);
	}

	updateUserConfirmationSuccess (callback) {
		let op = {
			set: {
				isRegistered: true
			},
			unset: {
				confirmationCode: true,
				confirmationAttempts: true,
				confirmationCodeExpiresAt: true
			}
		};
		if (this.passwordHash) {
			op.set.passwordHash = this.passwordHash;
		}
		if (this.request.body.username) {
			op.set.username = this.request.body.username;
		}
		this.data.users.applyOpById(
			this.user.id,
			op,
			(error, updatedUser) => {
				if (error) { return callback(error); }
				this.user = updatedUser;
				callback();
			}
		);
	}

	generateToken (callback) {
		if (this.confirmationFailed) { return callback(); }
		Tokenizer(
			this.user.attributes,
			this.api.config.secrets.auth,
			(error, token) => {
				if (error) {
					return callback(this.errorHandler.error('token', { reason: error }));
				}
				this.accessToken = token;
				process.nextTick(callback);
			}
		);
	}

	grantSubscriptionPermissions (callback) {
		// note - it is tough to determine whether this should go before or after the response ... with users in a lot
		// of streams, there could be a performance hit here, but do we want to take a performance hit or do we want
		// to risk the client subscribing to channels for which they don't yet have permissions? i've opted for the
		// performance hit, and i suspect it won't ever be a problem, but be aware...
		new UserSubscriptionGranter({
			data: this.data,
			messager: this.api.services.messager,
			user: this.user
		}).grantAll(error => {
			if (error) {
				return callback(this.errorHandler.error('messagingGrant', { reason: error }));
			}
			callback();
		});
	}

	formResponse (callback) {
		if (this.confirmationFailed) {
			if (this.maxConfirmationAttempts) {
				return callback(this.errorHandler.error('tooManyConfirmAttempts'));
			}
			else if (this.confirmationExpired) {
				return callback(this.errorHandler.error('confirmCodeExpired'));
			}
			else {
				return callback(this.errorHandler.error('confirmCodeMismatch'));
			}
		}
		else {
			this.responseData = {
				user: this.user.getSanitizedObject(),
				accessToken: this.accessToken
			};
			return process.nextTick(callback);
		}
	}

	postProcess (callback) {
		this.publishUserRegistrationToTeams(callback);
	}

	publishUserRegistrationToTeams (callback) {
		new UserPublisher({
			user: this.user.attributes,
			requestId: this.request.id,
			messager: this.api.services.messager,
			logger: this
		}).publishUserRegistrationToTeams(callback);
	}
}

module.exports = ConfirmRequest;
