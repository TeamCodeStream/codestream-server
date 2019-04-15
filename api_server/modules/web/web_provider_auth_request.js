'use strict';

const APIRequest = require(process.env.CS_API_TOP + '/lib/api_server/api_request.js');
const WebErrors = require('./errors');

class WebProviderAuthRequest extends APIRequest {

	async authorize () {
	}

	async process () {
		this.provider = this.request.params.provider.toLowerCase();
		this.serviceAuth = this.api.services[`${this.provider}Auth`];
		if (!this.serviceAuth) {
			this.warn(`Auth service ${this.provider} is not available`);
			this.redirectLogin(WebErrors.internalError.code);
			return;
		}

		const expiresAt = Date.now() + 2 * 60 * 1000;
		const payload = {
			userId: 'anonCreate', //this.request.query.createOk ? 'anonCreate' : 'anon',
			teamId: this.request.query.teamId || '',
			url: `${this.api.config.api.publicApiUrl}/web/provider-auth-complete/${this.provider}`,
			end: this.request.query.url || '',
			st: this.request.query.signupToken || ''
		};
		const code = this.api.services.tokenHandler.generate(
			payload,
			'pauth',
			{ expiresAt }
		);
		this.response.cookie(`t-${this.provider}`, code, {
			secure: true,
			signed: true
		});

		// set up options for initiating a redirect 
		const { authOrigin, callbackEnvironment } = this.api.config.api;
		let state = `${callbackEnvironment}!${code}`;
		const redirectUri = `${authOrigin}/provider-token/${this.provider}`;
		const options = {
			state,
			provider: this.provider,
			request: this,
			redirectUri
		};

		// get the specific query data to use in the redirect, and respond with the redirect url
		const { parameters, url } = this.serviceAuth.getRedirectData(options); 
		const query = Object.keys(parameters)
			.map(key => `${key}=${encodeURIComponent(parameters[key])}`)
			.join('&');
		this.response.redirect(`${url}?${query}`);
		this.responseHandled = true;
	}

	redirectLogin (error) {
		const url = encodeURIComponent(this.request.query.url);
		this.response.redirect(`/web/login?error=${error}&url=${url}`);
		this.responseHandled = true;
	}
}

module.exports = WebProviderAuthRequest;
