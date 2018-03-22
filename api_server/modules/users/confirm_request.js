// handle "POST /no-auth/confirm" request to confirm registration for a user

'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request.js');
var Tokenizer = require('./tokenizer');
var PasswordHasher = require('./password_hasher');
var UsernameChecker = require('./username_checker');
var UserSubscriptionGranter = require('./user_subscription_granter');
var UserPublisher = require('./user_publisher');
var InitialDataFetcher = require('./initial_data_fetcher');
const TeamErrors = require(process.env.CS_API_TOP + '/modules/teams/errors.js');
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

	// process the request...
	process (callback) {
		BoundAsync.series(this, [
			this.requireAndAllow,		// require parameters, and filter out unknown parameters
			this.getUser,				// get the user indicated
			this.checkAttributes,		// check the attributes provided in the request
			this.verifyCode,			// verify the confirmation code is correct
			this.hashPassword,			// hash the provided password, if given
			this.checkUsernameUnique,	// check that the user's username will be unique for their team, as needed
			this.generateToken,			// generate an access token for the user
			this.updateUser,			// update the user's database record
			this.grantSubscriptionPermissions,	// grant subscription permissions for the user to receive messages
			this.getInitialData,		// get the "initial data" to return in the request response
			this.formResponse			// form the request response to send back to the client
		], error => {
			if (error === true) {
				// short-cut the series and return a failure response
				this.failedConfirmation(callback);
			}
			else {
				callback(error);
			}
		});
	}

	// require certain parameters, and discard unknown parameters
	requireAndAllow (callback) {
		this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['userId', 'email', 'confirmationCode']
				},
				optional: {
					string: ['password', 'username']
				}
			},
			callback
		);
	}

	// get the user, as given by the userId
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

	// check that the given attributes match the user
	checkAttributes (callback) {
		// can't confirm a deactivated account
		if (!this.user || this.user.get('deactivated')) {
			return callback(this.errorHandler.error('notFound', { info: 'userId' }));
		}
		// can't set a different email (though we tolerate case variance)
		if (this.user.get('searchableEmail') !== this.request.body.email.toLowerCase()) {
			return callback(this.errorHandler.error('emailMismatch'));
		}
		// can't confirm an already-confirmed user
		if (this.user.get('isRegistered')) {
			return callback(this.errorHandler.error('alreadyRegistered'));
		}
		// must provide a password for confirmation if we don't already have one
		if (!this.user.get('passwordHash') && !this.request.body.password) {
			return callback(this.errorHandler.error('parameterRequired', { info: 'password' }));
		}
		// must provide a username for confirmation if we don't already have one
		if (!this.user.get('username') && !this.request.body.username) {
			return callback(this.errorHandler.error('parameterRequired', { info: 'username' }));
		}
		process.nextTick(callback);
	}

	// verify the confirmation code given in the request against the one that was generated
	verifyCode (callback) {
		// we give the user 3 attempts to enter a confirmation code, after that, they'll
		// have to get a new confirmation email sent to them
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

	// hash the given password, as needed
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

	// check that the user's username will be unique for the team(s) they are on
	checkUsernameUnique (callback) {
		if ((this.user.get('teamIds') || []).length === 0) {
			return callback();
		}
		let username = this.request.body.username || this.user.get('username');
		if (!username) {
			return callback();
		}
		// we check against each team the user is on, it must be unique in all teams
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

	// confirmation successful, now generate an access token for the user to use
	// for all future requests
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

	// update the user in the database, indicating they are confirmed
	updateUser (callback) {
		BoundAsync.series(this, [
			this.getFirstTeam,		// get the first team the user is on, if needed, this becomes the "origin" team
			this.getTeamCreator,	// get the creator of that team
			this.doUserUpdate
		], callback);
	}

	// get the first team the user is on, if needed
	// this is need to determine the "origin team" for the user, for analytics
	getFirstTeam (callback) {
		if ((this.user.get('teamIds') || []).length === 0) {
			return callback();
		}
		const teamId = this.user.get('teamIds')[0];
		this.data.teams.getById(
			teamId,
			(error, team) => {
				if (error) { return callback(error); }
				this.firstTeam = team;
				callback();
			}
		);
	}

	// get the creator of the first team the user was on, if needed
	// this is need to determine the "origin team" for the user, for analytics
	getTeamCreator (callback) {
		if (!this.firstTeam) {
			return callback();
		}
		this.data.users.getById(
			this.firstTeam.get('creatorId'),
			(error, creator) => {
				if (error) { return callback(error); }
				this.teamCreator = creator;
				callback();
			}
		);
	}

	// update the user in the database, indicating they are confirmed,
	// and add analytics data or other attributes as needed
	doUserUpdate (callback) {
		const now = Date.now();
		let op = {
			'$set': {
				isRegistered: true,
				modifiedAt: now,
				registeredAt: now,
				accessToken: this.accessToken
			},
			'$unset': {
				confirmationCode: true,
				confirmationAttempts: true,
				confirmationCodeExpiresAt: true
			}
		};
		if (this.passwordHash) {
			op.$set.passwordHash = this.passwordHash;
		}
		if (this.request.body.username) {
			op.$set.username = this.request.body.username;
		}
		if ((this.user.get('teamIds') || []).length > 0) {
			if (!this.user.get('joinMethod')) {
				op.$set.joinMethod = 'Added to Team';	// for tracking
			}
			if (!this.user.get('primaryReferral')) {
				op.$set.primaryReferral = 'internal';
			}
			if (
				!this.user.get('originTeamId') &&
				this.teamCreator &&
				this.teamCreator.get('originTeamId')
			) {
				op.$set.originTeamId = this.teamCreator.get('originTeamId');
			}
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

	// grant the user permission to subscribe to various messager channels
	grantSubscriptionPermissions (callback) {
		// note - it is tough to determine whether this should go before or after the response ... with users in a lot
		// of streams, there could be a performance hit here, but do we want to take a performance hit or do we want
		// to risk the client subscribing to channels for which they don't yet have permissions? i've opted for the
		// performance hit, and i suspect it won't ever be a problem, but be aware...
		new UserSubscriptionGranter({
			data: this.data,
			messager: this.api.services.messager,
			user: this.user,
			request: this
		}).grantAll(error => {
			if (error) {
				return callback(this.errorHandler.error('messagingGrant', { reason: error }));
			}
			callback();
		});
	}

	// get the initial data to return in the response, this is a time-saver for the client
	// so it doesn't have to fetch this data with separate requests
	getInitialData (callback) {
		new InitialDataFetcher({
			request: this
		}).fetchInitialData((error, initialData) => {
			if (error) { return callback(error); }
			this.initialData = initialData;
			callback();
		});
	}

	// form the response to the request
	formResponse (callback) {
		this.responseData = {
			user: this.user.getSanitizedObjectForMe(),	// include me-only attributes
			accessToken: this.accessToken,				// access token to supply in future requests
			pubnubKey: this.api.config.pubnub.subscribeKey	// give them the subscribe key for pubnub
		};
		Object.assign(this.responseData, this.initialData);
		return process.nextTick(callback);
	}

	// user failed confirmation for whatever reason, we'll do a database update
	// and return the appropriate error in the response
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

	// update the user's record in the database indicating a confirmation failure
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

	// after the request returns a response....
	postProcess (callback) {
		// publish the now-registered-and-confirmed user to all the team members
		this.publishUserToTeams(callback);
	}

	// publish the now-registered-and-confirmed user to all the team members,
	// over the team channel
	publishUserToTeams (callback) {
		new UserPublisher({
			user: this.user,
			data: this.user.getSanitizedObject(),
			request: this,
			messager: this.api.services.messager
		}).publishUserToTeams(callback);
	}
}

module.exports = ConfirmRequest;
