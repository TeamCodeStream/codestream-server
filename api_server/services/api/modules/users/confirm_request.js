'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var Restful_Request = require(process.env.CI_API_TOP + '/lib/util/restful/restful_request.js');
var Tokenizer = require('./tokenizer');
const Errors = require('./errors');

const MAX_CONFIRMATION_ATTEMPTS = 3;

class Confirm_Request extends Restful_Request {

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
			this.verify_code,
			this.update_user,
			this.generate_token,
			this.form_response
		], callback);
	}

	allow (callback) {
		this.allow_parameters(
			'body',
			{
				string: ['user_id', 'email', 'confirmation_code']
			},
			callback
		);
	}

	require (callback) {
		this.require_parameters(
			'body',
			['user_id', 'email', 'confirmation_code'],
			callback
		);
	}

	get_user (callback) {
		this.data.users.get_by_id(
			this.request.body.user_id,
			(error, user) => {
				if (error) { return callback(error); }
				if (!user || user.get('deactivated')) {
					return callback(this.error_handler.error('not_found', { info: 'user_id' }));
				}
				if (user.get('searchable_emails').indexOf(this.request.body.email.toLowerCase()) === -1) {
					return callback(this.error_handler.error('email_mismatch'));
				}
				if (user.get('is_registered')) {
					return callback(this.error_handler.error('already_registered'));
				}
				this.user = user;
				callback();
			}
		);
	}

	verify_code (callback) {
		if (this.request.body.confirmation_code !== this.user.get('confirmation_code')) {
			this.confirmation_failed = true;
			if (this.user.get('confirmation_attempts') === MAX_CONFIRMATION_ATTEMPTS) {
				this.max_confirmation_attempts = true;
			}
		}
		else if (Date.now() > this.user.get('confirmation_code_expires_at')) {
			this.confirmation_failed = true;
			this.confirmation_expired = true;
		}
		process.nextTick(callback);
	}

	update_user (callback) {
		if (this.confirmation_failed) {
			this.update_user_confirmation_failed(callback);
		}
		else {
			this.update_user_confirmation_success(callback);
		}
	}

	update_user_confirmation_failed (callback) {
		var set = {};
		if (this.max_confirmation_attempts || this.confirmation_expired) {
			set.confirmation_code = null;
			set.confirmation_attempts = 0;
			set.confirmation_code_expires_at = null;
		}
		else {
			set.confirmation_attempts = this.user.get('confirmation_attempts') + 1;
		}
		this.data.users.update_direct(
			{ _id: this.data.users.object_id_safe(this.request.body.user_id) },
			{ $set: set },
			callback
		);
	}

	update_user_confirmation_success (callback) {
		let op = {
			set: {
				is_registered: true
			},
			unset: {
				confirmation_code: true,
				confirmation_attempts: true,
				confirmation_code_expires_at: true
			}
		};
		this.data.users.apply_op_by_id(
			this.user.id,
			op,
			(error, updated_user) => {
				if (error) { return callback(error); }
				this.user = updated_user;
				callback();
			}
		);
	}

	generate_token (callback) {
		if (this.confirmation_failed) { return callback(); }
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

	form_response (callback) {
		if (this.confirmation_failed) {
			if (this.max_confirmation_attempts) {
				return callback(this.error_handler.error('too_many_confirm_attempts'));
			}
			else if (this.confirmation_expired) {
				return callback(this.error_handler.error('confirm_code_expired'));
			}
			else {
				return callback(this.error_handler.error('confirm_code_mismatch'));
			}
		}
		else {
			this.response_data = {
				user: this.user.get_sanitized_object(),
				access_token: this.access_token
			};
			return process.nextTick(callback);
		}
	}
}

module.exports = Confirm_Request;
