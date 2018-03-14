// handle the "PUT /no-auth/login" request to log a user in, verifying password
// and giving them an access token to use for future requests

'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request.js');
var BCrypt = require('bcrypt');
var InitialDataFetcher = require('./initial_data_fetcher');
var UserSubscriptionGranter = require('./user_subscription_granter');
const Indexes = require('./indexes');
const Errors = require('./errors');

class LoginRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(Errors);
	}

	authorize (callback) {
		// no pre-authorization needed, authorization is done according to email and password
		return callback(false);
	}

	// process the request....
	process (callback) {
		BoundAsync.series(this, [
			this.requireAndAllow,			// require certain parameters, and discard unknown parameters
			this.getUser,					// get the user indicated by email in the request
			this.validatePassword,			// validate the given password matches their password hash
			this.getInitialData,			// fetch the initial data to return in the response
			this.grantSubscriptionPermissions,	// grant the user permission to subscribe to various messager channels
			this.formResponse				// form the response to the request
		], callback);
	}

	// require these parameters, and discard any unknown parameters
	requireAndAllow (callback) {
		this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['email', 'password']
				}
			},
			callback
		);
	}

	// get the user indicated by the passed email
	getUser (callback) {
		this.data.users.getOneByQuery(
			{
				searchableEmail: this.request.body.email.toLowerCase()
			},
			(error, user) => {
				if (error) { return callback(error); }
				if (!user || user.get('deactivated')) {
					return callback(this.errorHandler.error('notFound', { info: 'email' }));
				}
				this.user = user;
				process.nextTick(callback);
			},
			{
				databaseOptions: {
					hint: Indexes.bySearchableEmail
				}
			}
		);
	}

	// validate that the given password matches the password hash stored for the user
	validatePassword (callback) {
	 	BCrypt.compare(
	 		this.request.body.password,
	 		this.user.get('passwordHash'),
	 		(error, result) => {
	 			if (error) {
					return callback(this.errorHandler.error('token', { reason: error }));
				}
	 			if (!result) {
	 				return callback(this.errorHandler.error('passwordMismatch'));
	 			}
	 			process.nextTick(callback);
	 		}
	 	);
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

	// form the response to the request
	formResponse (callback) {
		this.responseData = {
			user: this.user.getSanitizedObjectForMe(),	// include me-only attributes
			accessToken: this.user.get('accessToken'),	// access token to supply in future requests
			pubnubKey: this.api.config.pubnub.subscribeKey	// give them the subscribe key for pubnub
		};
		Object.assign(this.responseData, this.initialData);
		return process.nextTick(callback);
	}
}

module.exports = LoginRequest;
