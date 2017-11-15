'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var JSONWebToken = require('jsonwebtoken');
var ErrorHandler = require(process.env.CS_API_TOP + '/lib/util/error_handler');
const Errors = require('./errors');

class TokenAuthenticator {

	constructor (options) {
		Object.assign(this, options);
		this.errorHandler = new ErrorHandler(Errors);
	}

	authenticate (callback) {
		BoundAsync.series(this, [
			this.getToken,
			this.verifyToken,
			this.getUser
		], (error) => {
			if (error === true) {
				return callback(); // no authentication necessary
			}
			else {
				return callback(error);
			}
		});
	}

	getToken (callback) {
		if (this.pathIsNoAuth(this.request)) {
			return callback(true);
		}
		let token =
			(this.request.signedCookies && this.request.signedCookies.t) ||
			(this.request.query && this.request.query.t && decodeURIComponent(this.request.query.t)) ||
			(this.request.body && this.request.body.t) ||
			this.tokenFromHeader(this.request);
		if (!token) {
			return callback(this.errorHandler.error('missingAuthorization'));
		}
		this.token = token;
		process.nextTick(callback);
	}

	verifyToken (callback) {
		JSONWebToken.verify(
			this.token,
			this.api.config.secrets.auth,
			(error, payload) => {
				if (error) {
					return callback(this.errorHandler.error('tokenInvalid', { reason: error }));
				}
				this.payload = payload;
				process.nextTick(callback);
			}
		);
	}

	getUser (callback) {
		let userId = this.payload.userId;
		if (!userId) {
			return callback(this.errorHandler.error('noUserId'));
		}
		this.api.data.users.getById(
			userId,
			(error, user) => {
				if (error) {
					return callback(this.errorHandler.error('internal', { reason: error }));
				}
				if (!user) {
					return callback(this.errorHandler.error('userNotFound'));
				}
				if (this.userClass) {
					this.request.user = new this.userClass(user);
				}
				else {
					this.request.user = user;
				}
				this.request.authPayload = this.payload;
				process.nextTick(callback);
			},
			{
				requestId: this.request.id
			}
		);
	}

	pathIsNoAuth (request) {
		return request.path.match(/^\/no-auth\//);
	}

	tokenFromHeader (request) {
		if (request.headers.authorization) {
			let match = request.headers.authorization.match(/^Bearer (.+)$/);
			return match && match[1];
		}
	}
}

module.exports = TokenAuthenticator;
