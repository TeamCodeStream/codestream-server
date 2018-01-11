// provides a class to authenticate a request based on a token passed in;
// the token can come from a variety of sources, like cookie, query parameter,
// body, or header

'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var JSONWebToken = require('jsonwebtoken');
var ErrorHandler = require(process.env.CS_API_TOP + '/server_utils/error_handler');
const Errors = require('./errors');

class TokenAuthenticator {

	constructor (options) {
		Object.assign(this, options);
		this.errorHandler = new ErrorHandler(Errors);
	}

	// authenticate the request, we'll look for the token in a variety of places
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

	// get the authentication token from any number of places
	getToken (callback) {
		if (this.pathIsNoAuth(this.request)) {
			// e.g. '/no-auth/path' ... no authentication required
			return callback(true);
		}
		// look for a token in this order: cookie, query, body, header
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

	// verify the token is valid and extract its payload
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

	// get the user associated with this token payload
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
					// make a model out of the user attributes
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

	// certain paths signal that no authentication is required
	pathIsNoAuth (request) {
		// we'll use anything starting with /no-auth
		return request.path.match(/^\/no-auth\//);
	}

	// look for the token in the http request headers
	tokenFromHeader (request) {
		if (request.headers.authorization) {
			let match = request.headers.authorization.match(/^Bearer (.+)$/);
			return match && match[1];
		}
	}
}

module.exports = TokenAuthenticator;
