'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request.js');
var BCrypt = require('bcrypt');
var Tokenizer = require('./tokenizer');
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
			this.allow,
			this.require,
			this.getUser,
			this.validatePassword,
			this.generateToken
		], callback);
	}

	allow (callback) {
		this.allowParameters(
			'body',
			{
				string: ['email', 'password']
			},
			callback
		);
	}

	require (callback) {
		this.requireParameters(
			'body',
			['email', 'password'],
			callback
		);
	}

	getUser (callback) {
		this.data.users.getOneByQuery(
			{
				searchableEmail: this.request.body.email.toLowerCase(),
				deactivated: false
			},
			(error, user) => {
				if (error) { return callback(error); }
				if (!user) {
					return callback(this.errorHandler.error('notFound', { info: 'email' }));
				}
				this.user = user;
				process.nextTick(callback);
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

	generateToken (callback) {
		Tokenizer(
			this.user.attributes,
			this.api.config.secrets.auth,
			(error, token) => {
				if (error) {
					return callback(this.errorHandler.error('token', { reason: error }));
				}
				this.responseData = {
					user: this.user.getSanitizedObject(),
					accessToken: token
				};
				process.nextTick(callback);
			}
		);
	}
}

module.exports = LoginRequest;
