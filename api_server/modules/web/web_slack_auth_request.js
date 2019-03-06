'use strict';

const APIRequest = require(process.env.CS_API_TOP + '/lib/api_server/api_request.js');
const WebErrors = require('./errors');

class WebSlackAuthRequest extends APIRequest {

	async authorize () {
	}

	async process () {
		if (!this.api.services.slackAuth) {
			this.warn('Slack auth is not available');
			this.redirectLogin(WebErrors.internalError.code);
			return;
		}

		const expiresAt = Date.now() + 2 * 60 * 1000;
		const payload = {
			userId: 'anon',
			url: `https://${this.request.hostname}:${this.api.config.express.port}/web/slack-auth-complete`,
			end: this.request.query.url
		};
		const code = this.api.services.tokenHandler.generate(
			payload,
			'pauth',
			{ expiresAt }
		);
		this.response.cookie('tslack', code, {
			secure: true,
			signed: true
		});

		// set up options for initiating a redirect 
		const { authOrigin, callbackEnvironment } = this.api.config.api;
		let state = `${callbackEnvironment}!${code}`;
		const redirectUri = `${authOrigin}/provider-token/slack`;
		const options = {
			state,
			provider: 'slack',
			request: this,
			redirectUri
		};

		// get the specific query data to use in the redirect, and respond with the redirect url
		const { parameters, url } = this.api.services.slackAuth.getRedirectData(options); 
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

module.exports = WebSlackAuthRequest;
