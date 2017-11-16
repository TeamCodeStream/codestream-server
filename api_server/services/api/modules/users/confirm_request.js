'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request.js');
var Tokenizer = require('./tokenizer');
var PasswordHasher = require('./password_hasher');
var UsernameChecker = require('./username_checker');
var UserSubscriptionGranter = require('./user_subscription_granter');
var UserPublisher = require('./user_publisher');
var InitialDataFetcher = require('./initial_data_fetcher');
const TeamErrors = require(process.env.CS_API_TOP + '/services/api/modules/teams/errors.js');
const Errors = require('./errors');

const MAX_CONFIRMATION_ATTEMPTS = 3;

class ConfirmRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(Errors);
		this.errorHandler.add(TeamErrors);
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
			this.checkUsernameUnique,
			this.updateUser,
			this.generateToken,
			this.grantSubscriptionPermissions,
			this.getInitialData,
			this.formResponse
		], error => {
			if (error === true) {
				this.failedConfirmation(callback);
			}
			else {
				callback(error);
			}
		});
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
		let confirmFailed = false;
		if (this.request.body.confirmationCode !== this.user.get('confirmationCode')) {
			confirmFailed = true;
			if (this.user.get('confirmationAttempts') === MAX_CONFIRMATION_ATTEMPTS) {
				this.maxConfirmationAttempts = true;
			}
		}
		else if (Date.now() > this.user.get('confirmationCodeExpiresAt')) {
			confirmFailed = true;
			this.confirmationExpired = true;
		}
		callback(confirmFailed);	// if true, shortcuts and prepares for failure response
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

	checkUsernameUnique (callback) {
		if ((this.user.get('teamIds') || []).length === 0) {
			return callback();
		}
		let username = this.request.body.username || this.user.get('username');
		if (!username) {
			return callback();
		}
		let teamIds = this.user.get('teamIds');
		let usernameChecker = new UsernameChecker({
			data: this.data,
			username: username,
			userId: this.user.id,
			teamIds: teamIds
		});
		usernameChecker.checkUsernameUnique((error, isUnique) => {
			if (error) { return callback(error); }
			if (!isUnique) {
				return callback(this.errorHandler.error('usernameNotUnique', {
					info: {
						username: username,
						teamIds: usernameChecker.notUniqueTeamIds
					}
				}));
			}
			else {
				return callback();
			}
		});
	}

	updateUser (callback) {
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

	getInitialData (callback) {
		new InitialDataFetcher({
			request: this
		}).fetchInitialData((error, initialData) => {
			if (error) { return callback(error); }
			this.initialData = initialData;
			callback();
		});
	}

	formResponse (callback) {
		this.responseData = {
			user: this.user.getSanitizedObject(),
			accessToken: this.accessToken
		};
		Object.assign(this.responseData, this.initialData);
		return process.nextTick(callback);
	}

	failedConfirmation (callback) {
		this.updateUserConfirmationFailed(error => {
			if (error) { return callback(error); }
			if (this.maxConfirmationAttempts) {
				return callback(this.errorHandler.error('tooManyConfirmAttempts'));
			}
			else if (this.confirmationExpired) {
				return callback(this.errorHandler.error('confirmCodeExpired'));
			}
			else {
				return callback(this.errorHandler.error('confirmCodeMismatch'));
			}
		});
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
