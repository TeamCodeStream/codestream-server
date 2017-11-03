'use strict';

var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var Restful_Request = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request.js');
var User_Creator = require('./user_creator');
var Confirm_Code = require('./confirm_code');
var Tokenizer = require('./tokenizer');

const CONFIRMATION_CODE_TIMEOUT = 7 * 24 * 60 * 60 * 1000;

class Register_Request extends Restful_Request {

	constructor (options) {
		super(options);
		this.confirmation_required = this.api.config.api.confirmation_required || this.request.body._force_confirmation;
		delete this.request.body._force_confirmation;
	}

	authorize (callback) {
		return callback(false);
	}

	process (callback) {
		Bound_Async.series(this, [
			this.allow,
			this.require,
			this.generate_confirm_code,
			this.save_user,
			this.send_email,
			this.generate_token
		], (error) => {
			if (error) { return callback(error); }
			this.response_data = { user: this.user.get_sanitized_object() };
			if (this.confirmation_cheat === this.api.config.secrets.confirmation_cheat) {
				// this allows for testing without actually receiving the email
				this.log('Confirmation cheat detected, hopefully this was called by test code');
				this.response_data.user.confirmation_code = this.user.get('confirmation_code');
			}
			if (this.access_token) {
				this.response_data.access_token = this.access_token;
			}
			callback();
		});
	}

	allow (callback) {
		this.confirmation_cheat = this.request.body._confirmation_cheat;	// cheat code for testing only
		delete this.request.body._confirmation_cheat;
		this.allow_parameters(
			'body',
			{
				string: ['email', 'password', 'username', 'first_name', 'last_name'],
				number: ['timeout'],
				'array(string)': ['secondary_emails']
			},
			callback
		);
	}

	require (callback) {
		this.require_parameters(
			'body',
			['email', 'password', 'username'],
			callback
		);
	}

	generate_confirm_code (callback) {
		if (!this.confirmation_required) {
			this.log('Note: confirmation not required in environment - THIS SHOULD NOT BE PRODUCTION - email will be automatically confirmed');
			this.request.body.is_registered = true;
			return callback();
		}
		this.request.body.confirmation_code = Confirm_Code();
		this.request.body.confirmation_attempts = 0;
		let timeout = this.request.body.timeout || CONFIRMATION_CODE_TIMEOUT;
		timeout = Math.min(timeout, CONFIRMATION_CODE_TIMEOUT);
		this.request.body.confirmation_code_expires_at = Date.now() + timeout;
		delete this.request.body.timeout;
		process.nextTick(callback);
	}

	save_user (callback) {
		this.user_creator = new User_Creator({
			request: this,
			not_ok_if_exists_and_registered: true
		});
		this.user_creator.create_user(
			this.request.body,
			(error, user) => {
				if (error) { return callback(error); }
				this.user = user;
				callback();
			}
		);
	}

	send_email (callback) {
		if (!this.confirmation_required) {
			return callback();
		}
		this.api.services.email.send_confirmation_email(
			{
				user: this.user.attributes,
				email: this.user.get('email'),
				request: this
			},
			callback
		);
	}

	generate_token (callback) {
		if (this.confirmation_required) {
			return callback();
		}
		Tokenizer(
			this.user.attributes,
			this.api.config.secrets.auth,
			(error, token) => {
				if (error) {
					return callback(this.error_handler.error('token', { reason: error }));
				}
				this.access_token = token;
				process.nextTick(callback);
			}
		);
	}
}

module.exports = Register_Request;
