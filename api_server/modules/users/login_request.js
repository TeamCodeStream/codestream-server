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
		return callback(false);
	}

	process (callback) {
		BoundAsync.series(this, [
			this.requireAndAllow,
			this.getUser,
			this.validatePassword,
			this.getInitialData,
			this.grantSubscriptionPermissions,
			this.formResponse
		], callback);
	}

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

	getInitialData (callback) {
		new InitialDataFetcher({
			request: this
		}).fetchInitialData((error, initialData) => {
			if (error) { return callback(error); }
			this.initialData = initialData;
			callback();
		});
	}

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

	formResponse (callback) {
		let meOnlyAttributes = this.user.getMeOnlyAttributes();
		this.responseData = {
			user: this.user.getSanitizedObject(),
			accessToken: this.user.get('accessToken')
		};
		Object.assign(this.responseData, this.initialData);
		Object.assign(this.responseData.user, meOnlyAttributes);
		return process.nextTick(callback);
	}
}

module.exports = LoginRequest;
