'use strict';

const APIRequest = require(process.env.CS_API_TOP + '/lib/api_server/api_request.js');
const UserErrors = require(process.env.CS_API_TOP + '/modules/users/errors');
const WebErrors = require('./errors');
const SigninFlowUtils = require('./signin_flow_utils');

class WebProviderAuthCompleteRequest extends APIRequest {

	async authorize () {
		// we'll handle auth during the request
	}

	async process () {
		this.provider = this.request.params.provider.toLowerCase();
		this.serviceAuth = this.api.services[`${this.provider}Auth`];
		if (!this.serviceAuth) {
			this.warn(`Auth service ${this.provider} is not available`);
			return this.badError();
		}

		await this.verifyState() &&			// verify the state token passed in
		await this.handleError() &&			// handle any error in the query
		await this.matchSignupToken() &&	// match the signup token to a user ID
		await this.getUser() &&				// get the user
		await this.issueCookie() &&			// once authenticated, issue cookie
		await this.finishFlow();			// finish the flow, and redirect where needed
	}

	async verifyState () {
		if (this.request.query.error) { return true; }
		// we should get a state parameter in the query, and we should have a stored cookie,
		// and they should match
		const { state } = this.request.query;
		const stateProps = state.split('!');
		this.code = stateProps[1];
		const storedCode = this.request.signedCookies[`t-${this.provider}`];
		if (!this.code || !storedCode || this.code !== storedCode) {
			this.warn(`Received state code ${this.code} which did not match stored ${storedCode}`);
			return this.badError();
		}
		this.response.clearCookie(`t-${this.provider}`, {
			secure: true,
			signed: true
		});

		// decode the payload
		try {
			this.payload = this.api.services.tokenHandler.decode(this.code);
		}
		catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			this.warn(`Unable to verify token payload: ${message}`);
			return this.badError();
		}
		if (!this.payload) {
			this.warn('Unable to parse token payload');
			return this.badError();
		}
		if (this.payload.type !== 'pauth') {
			this.warn('Not a provider auth token');
			return this.badError();
		}
		return true;
	}

	async handleError () {
		const { error } = this.request.query;
		if (!error) {
			return true;
		}
		const errorType = Object.keys(UserErrors).find(userError => {
			return UserErrors[userError].code === error;
		});
		switch (errorType) {

		case 'inviteTeamMismatch':
			return this.loginError(WebErrors.workspaceNotFound);

		case 'noIdentityMatch': {
			const email = this.request.query.email ?
				decodeURIComponent(this.request.query.email).toLowerCase() :
				`${this.provider} user`;
			return this.loginError(WebErrors.userNotFound, { email });
		}

		case 'duplicateProviderAuth':
			return this.loginError(UserErrors.duplicateProviderAuth);

		default:
			if (this.payload) {
				return this.loginError(WebErrors.unknownError, { error });
			}
			else {
				return this.badError(error);
			}
		}
	}

	async matchSignupToken () {
		const token = this.payload.st || this.code;
		const info = await this.api.services.signupTokens.find(
			token,
			{ requestId: this.request.id }
		);
		if (!info) {
			return this.loginError(WebErrors.providerLoginFailed);
		}
		else if (info.expired) {
			return this.loginError(WebErrors.tokenExpired);
		}
		else {
			this.userId = info.userId;
		}
		return true;
	}

	async getUser () {
		if (!this.userId) {
			this.warn('No userId obtained from request');
			return this.loginError(WebErrors.noUser);
		}
		this.user = await this.data.users.getById(this.userId);
		if (!this.user) {
			this.warn('User not found: ' + this.userId);
			return this.loginError(WebErrors.userNotFound, { email: 'CodeStream user' });
		}
		return true;
	}

	issueCookie () {
		this.token = 
			(this.user.get('accessTokens') || {}) &&
			(this.user.get('accessTokens').web || {}) &&
			this.user.get('accessTokens').web.token;
		if (!this.token) {
			this.warn('User is not yet registered with CodeStream.');
			return this.loginError(WebErrors.userNotRegistered);
		}

		const twentyYears = 20 * 365 * 24 * 60 * 60 * 1000;
		this.response.cookie(this.api.config.api.identityCookie, this.token, {
			secure: true,
			signed: true,
			expires: new Date(Date.now() + twentyYears)
		});
		return true;
	}

	finishFlow () {
		this.responseHandled = new SigninFlowUtils(this).finish(this.payload.end, {
			provider: this.provider
		});
	}

	badError (errorCode) {
		let redirect = `/web/error?provider=${this.provider}`;
		if (errorCode) {
			redirect += '&code=' + errorCode;
		}
		this.response.redirect(redirect);
		this.responseHandled = true;
	}

	loginError (error, data) {
		if (!this.payload || !this.payload.end) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			this.warn('Auth complete request failed: ' + message);
			return this.badError(error.code);
		}
		let redirect = `${this.payload.end}?error=${error.code}&provider=${this.provider}`;
		if (data) {
			redirect += `&errorData=${encodeURIComponent(JSON.stringify(data))}`;
		}
		this.warn('Web login error: ' + error.code);
		this.response.redirect(redirect);
		this.responseHandled = true;
	}
}

module.exports = WebProviderAuthCompleteRequest;
