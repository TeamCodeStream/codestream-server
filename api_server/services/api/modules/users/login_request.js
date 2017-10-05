'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var Restful_Request = require(process.env.CI_API_TOP + '/lib/util/restful/restful_request.js');
var BCrypt = require('bcrypt');
var Tokenizer = require('./tokenizer');
var User = require('./user');
const Errors = require('./errors');

class Login_Request extends Restful_Request {

	constructor (options) {
		super(options);
		this.error_handler.add(Errors);
	}

	authorize (callback) {
		return callback(false);
	}

	process (callback) {
		Bound_Async.series(this, [
			this.allow,
			this.require,
			this.get_user,
			this.validate_password,
			this.generate_token
		], callback);
	}

	allow (callback) {
		this.allow_parameters(
			'body',
			{
				string: ['email', 'password']
			},
			callback
		);
	}

	require (callback) {
		this.require_parameters(
			'body',
			['email', 'password'],
			callback
		);
	}

	get_user (callback) {
		this.data.users.get_one_by_query(
			{
				searchable_emails: this.request.body.email.toLowerCase(),
				deactivated: false
			},
			(error, user) => {
				if (error) { return callback(error); }
				if (!user) {
					return callback(this.error_handler.error('not_found', { info: 'email' }));
				}
				this.user = user;
				process.nextTick(callback);
			}
		);
	}

	validate_password (callback) {
	 	BCrypt.compare(
	 		this.request.body.password,
	 		this.user.get('password_hash'),
	 		(error, result) => {
	 			if (error) {
					return callback(this.error_handler.error('token', { reason: error }));
				}
	 			if (!result) {
	 				return callback(this.error_handler.error('password_mismatch'));
	 			}
	 			process.nextTick(callback);
	 		}
	 	);
	}

	generate_token (callback) {
		Tokenizer(
			this.user.attributes,
			this.api.config.secrets.auth,
			(error, token) => {
				if (error) {
					return callback(this.error_handler.error('token', { reason: error }));
				}
				this.response_data = {
					user: this.user.get_sanitized_object(),
					access_token: token
				};
				process.nextTick(callback);
			}
		);
	}
}

module.exports = Login_Request;
