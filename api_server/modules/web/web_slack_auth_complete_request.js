'use strict';

const APIRequest = require(process.env.CS_API_TOP + '/lib/api_server/api_request.js');
const UserErrors = require(process.env.CS_API_TOP + '/modules/users/errors');
const WebErrors = require('./errors');

class WebSlackAuthCompleteRequest extends APIRequest {

	async authorize () {
		// we'll handle auth during the request
	}

	async process () {
		await this.verifyState() &&			// verify the state token passed in
		await this.handleError() &&			// handle any error in the query
		await this.matchSignupToken() &&	// match the signup token to a user ID
		await this.getUser() &&				// get the user
		await this.issueCookie() &&			// once authenticated, issue cookie
		await this.finishFlow();			// finish the flow, and redirect where needed
	}

	async verifyState () {
		// we should get a state parameter in the query, and we should have a stored cookie,
		// and they should match
		const { state } = this.request.query;
		const stateProps = state.split('!');
		this.code = stateProps[1];

		const storedCode = this.request.signedCookies.tslack;
		if (!this.code || !storedCode || this.code !== storedCode) {
			this.warn(`Received state code ${this.code} which did not match stored ${storedCode}`);
			return this.badError();
		}
		this.response.clearCookie('tslack', {
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
				'Slack user';
			return this.loginError(WebErrors.userNotFound, { email });
		}

		case 'duplicateProviderAuth':
			return this.loginError(WebErrors.noAccessToCodemark);

		default:
			if (this.payload) {
				return this.loginError(WebErrors.unknownError, { error });
			}
			else {
				return this.badError();
			}
		}
	}

	async matchSignupToken () {
		const info = await this.api.services.signupTokens.find(
			this.code,
			{ requestId: this.request.id }
		);
		if (!info) {
			return this.loginError(WebErrors.slackLoginFailed);
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

		this.response.cookie('t', this.token, {
			secure: true,
			signed: true
		});
		return true;
	}

	finishFlow () {
		this.response.redirect(this.payload.end);
		this.responseHandled = true;
	}

	badError () {
		this.response.redirect('/web/error');
		this.responseHandled = true;
	}

	loginError (error, data) {
		let redirect = `${this.payload.end}?error=${error.code}`;
		if (data) {
			redirect += `&errorData=${encodeURIComponent(JSON.stringify(data))}`;
		}
		this.response.redirect(redirect);
		this.responseHandled = true;
	}
}

module.exports = WebSlackAuthCompleteRequest;
