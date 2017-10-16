'use strict';

var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var JSON_Web_Token = require('jsonwebtoken');
var Error_Handler = require(process.env.CS_API_TOP + '/lib/util/error_handler');
const Errors = require('./errors');

class Token_Authenticator {

	constructor (options) {
		Object.assign(this, options);
		this.error_handler = new Error_Handler(Errors);
	}

	authenticate (callback) {
		Bound_Async.series(this, [
			this.get_token,
			this.verify_token,
			this.get_user
		], (error) => {
			if (error === true) {
				return callback(); // no authentication necessary
			}
			else {
				return callback(error);
			}
		});
	}

	get_token (callback) {
		if (this.path_is_no_auth(this.request)) {
			return callback(true);
		}
		let token =
			(this.request.signedCookies && this.request.signedCookies.t) ||
			(this.request.query && this.request.query.t) ||
			(this.request.body && this.request.body.t) ||
			this.token_from_header(this.request);
		if (!token) {
			return callback(this.error_handler.error('missing_authorization'));
		}
		this.token = token;
		process.nextTick(callback);
	}

	verify_token (callback) {
		JSON_Web_Token.verify(
			this.token,
			this.api.config.secrets.auth,
			(error, payload) => {
				if (error) {
					return callback(this.error_handler.error('token_invalid', { reason: error }));
				}
				this.payload = payload;
				process.nextTick(callback);
			}
		);
	}

	get_user (callback) {
		let user_id = this.payload.user_id;
		if (!user_id) {
			return callback(this.error_handler.error('no_user_id'));
		}
		this.api.data.users.get_by_id(
			user_id,
			(error, user) => {
				if (error) {
					return callback(this.error_handler.error('internal', { reason: error }));
				}
				if (!user) {
					return callback(this.error_handler.error('user_not_found'));
				}
				if (this.user_class) {
					this.request.user = new this.user_class(user);
				}
				else {
					this.request.user = user;
				}
				this.request.auth_payload = this.payload;
				process.nextTick(callback);
			},
			{
				request_id: this.request.id
			}
		);
	}

	path_is_no_auth (request) {
		return request.path.match(/^\/no-auth\//);
	}

	token_from_header (request) {
		if (request.headers.authorization) {
			let match = request.headers.authorization.match(/^Bearer (.+)$/);
			return match && match[1];
		}
	}
}

module.exports = Token_Authenticator;
