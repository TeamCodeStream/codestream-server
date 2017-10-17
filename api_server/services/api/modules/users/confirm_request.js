'use strict';

var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var Restful_Request = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request.js');
var Tokenizer = require('./tokenizer');
var Password_Hasher = require('./password_hasher');
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
			this.check_attributes,
			this.verify_code,
			this.hash_password,
			this.update_user,
			this.generate_token,
			this.form_response
		], callback);
	}

	allow (callback) {
		this.allow_parameters(
			'body',
			{
				string: ['user_id', 'email', 'confirmation_code', 'password', 'username']
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
				this.user = user;
				callback();
			}
		);
	}

	check_attributes (callback) {
		if (!this.user || this.user.get('deactivated')) {
			return callback(this.error_handler.error('not_found', { info: 'user_id' }));
		}
		if (this.user.get('searchable_email') !== this.request.body.email.toLowerCase()) {
			return callback(this.error_handler.error('email_mismatch'));
		}
		if (this.user.get('is_registered')) {
			return callback(this.error_handler.error('already_registered'));
		}
		if (!this.user.get('password_hash') && !this.request.body.password) {
			return callback(this.error_handler.error('parameter_required', { info: 'password' }));
		}
		if (!this.user.get('username') && !this.request.body.username) {
			return callback(this.error_handler.error('parameter_required', { info: 'username' }));
		}
		process.nextTick(callback);
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

	hash_password (callback) {
		if (!this.request.body.password) { return callback(); }
		new Password_Hasher({
			error_handler: this.error_handler,
			password: this.request.body.password
		}).hash_password((error, password_hash) => {
			if (error) { return callback(error); }
			this.request.body.password_hash = password_hash;
			delete this.request.body.password;
			process.nextTick(callback);
		});
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
		let set = {};
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
		if (this.password_hash) {
			op.set.password_hash = this.password_hash;
		}
		if (this.request.body.username) {
			op.set.username = this.request.body.username;
		}
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
