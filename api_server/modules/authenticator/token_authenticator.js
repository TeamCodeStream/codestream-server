// provides a class to authenticate a request based on a token passed in;
// the token can come from a variety of sources, like cookie, query parameter,
// body, or header

'use strict';

const ErrorHandler = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/error_handler');
const Errors = require('./errors');

class TokenAuthenticator {

	constructor (options) {
		Object.assign(this, options);
		this.errorHandler = new ErrorHandler(Errors);
	}

	// authenticate the request, we'll look for the token in a variety of places
	async authenticate () {
		try {
			const noTokenNeeded = await this.getToken();
			if (noTokenNeeded) {
				return;
			}
			await this.verifyToken();
			await this.getUser();
			await this.validateToken();
		}
		catch (error) {
			if (
				this.pathIsCookieAuth(this.request) &&
				this.pathIsOptionalAuth(this.request)
			) {
				const cookie = this.api.config.apiServer.identityCookie || 't';
				this.response.clearCookie(cookie, {
					secure: true,
					signed: true
				});
				return;
			}
			else {
				throw error;
			}
		}
	}

	// get the authentication token from any number of places
	async getToken () {
		if (this.pathIsNoAuth(this.request)) {
			// e.g. '/no-auth/path' ... no authentication required
			return true;
		}
		let token;

		// certain paths required cookie authentication
		if (this.pathIsCookieAuth(this.request)) {
			const cookie = this.api.config.apiServer.identityCookie || 't';
			token = (this.request.signedCookies && this.request.signedCookies[cookie]);
		}

		// otherwise look for a Bearer token
		else {
			token =	this.tokenFromHeader(this.request);
		}


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
			this.payload = this.tokenHandler.verify(this.token);
		}
		catch (error) {
			const message = typeof error === 'object' ? error.message : error;
			throw this.errorHandler.error('tokenInvalid', { reason: message });
		}
	}

	// get the user associated with this token payload
	async getUser () {
		if (!this.payload) { return; }
		const userId = this.payload.uid || this.payload.userId;
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

	// now that we have the user, validate the token against issuance data for the user
	async validateToken () {
		if (!this.request.user) { return; }
		if (
			this.userClass &&
			typeof this.request.user.validateTokenPayload === 'function'
		) {
			const reason = this.request.user.validateTokenPayload(this.payload);
			if (reason) {
				throw this.errorHandler.error('tokenExpired', { reason });
			}
		}
	}

	// certain paths signal that no authentication is required,
	// according to config
	pathIsNoAuth (request) {
		const paths = this.api.config.apiServer.unauthenticatedPaths || [];
		return paths.find(path => {
			const regExp = new RegExp(path);
			return request.path.match(regExp);
		});
	}

	// for certain paths, authentication is optional,
	// according to config
	pathIsOptionalAuth (request) {
		const paths = this.api.config.apiServer.optionalAuthenticatedPaths || [];
		return paths.find(path => {
			const regExp = new RegExp(path);
			return request.path.match(regExp);
		});
	}

	// for certain paths, cookie authentication is required
	pathIsCookieAuth (request) {
		const paths = this.api.config.apiServer.cookieAuthenticatedPaths || [];
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
