'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request.js');
var BCrypt = require('bcrypt');
var InitialDataFetcher = require('./initial_data_fetcher');
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
