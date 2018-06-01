// provides a class to authenticate a request based on a token passed in;
// the token can come from a variety of sources, like cookie, query parameter,
// body, or header

'use strict';

const JSONWebToken = require('jsonwebtoken');
const ErrorHandler = require(process.env.CS_API_TOP + '/server_utils/error_handler');
const Errors = require('./errors');

class TokenAuthenticator {

	constructor (options) {
		Object.assign(this, options);
		this.errorHandler = new ErrorHandler(Errors);
	}

	// authenticate the request, we'll look for the token in a variety of places
	async authenticate () {
		const noTokenNeeded = await this.getToken();
		if (noTokenNeeded) {
			return;
		}
		await this.verifyToken();
		await this.getUser();
	}

	// get the authentication token from any number of places
	async getToken () {
		if (this.pathIsNoAuth(this.request)) {
			// e.g. '/no-auth/path' ... no authentication required
			return true;
		}
		// look for a token in this order: cookie, query, body, header
		const token =
			(this.request.signedCookies && this.request.signedCookies.t) ||
			(this.request.query && this.request.query.t && decodeURIComponent(this.request.query.t)) ||
			(this.request.body && this.request.body.t) ||
			this.tokenFromHeader(this.request);
		if (!token) {
			if (!this.pathIsOptionalAuth(this.request)) {
				throw this.errorHandler.error('missingAuthorization');
			}
		}
		this.token = token;
	}

	// verify the token is valid and extract its payload
	async verifyToken () {
		if (!this.token) { return; }
		try {
			this.payload = JSONWebToken.verify(this.token, this.api.config.secrets.auth);
		}
		catch (error) {
			const message = typeof error === 'object' ? error.message : error;
			throw this.errorHandler.error('tokenInvalid', { reason: message });
		}
	}

	// get the user associated with this token payload
	async getUser () {
		if (!this.payload) { return; }
		const userId = this.payload.userId;
		if (!userId) {
			throw this.errorHandler.error('noUserId');
		}
		let user;
		try {
			user = await this.api.data.users.getById(
				userId,
				{
					requestId: this.request.id
				}
			);
		}
		catch (error) {
			throw this.errorHandler.error('internal', { reason: error });
		}
		if (!user) {
			throw this.errorHandler.error('userNotFound');
		}
		if (this.userClass) {
			// make a model out of the user attributes
			this.request.user = new this.userClass(user);
		}
		else {
			this.request.user = user;
		}
		this.request.authPayload = this.payload;
	}

	// certain paths signal that no authentication is required,
	// according to config
	pathIsNoAuth (request) {
		const paths = this.api.config.api.unauthenticatedPaths || [];
		return paths.find(path => {
			const regExp = new RegExp(path);
			return request.path.match(regExp);
		});
	}

	// for certain paths, authentication is optional,
	// according to config
	pathIsOptionalAuth (request) {
		const paths = this.api.config.api.optionalAuthenticatedPaths || [];
		return paths.find(path => {
			const regExp = new RegExp(path);
			return request.path.match(regExp);
		});
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
