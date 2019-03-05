'use strict';

const APIRequest = require(process.env.CS_API_TOP + '/lib/api_server/api_request.js');

class WebSlackAuthRequest extends APIRequest {

	async authorize () {
	}

	async process () {
		if (!this.api.services.slackAuth) {
			throw 'slack auth is not available';
		}

		const expiresAt = Date.now() + 10 * 60 * 1000;
		const payload = {
			userId: 'anon'
		};
		const code = this.api.services.tokenHandler.generate(
			payload,
			'pauth',
			{ expiresAt }
		);

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
}

module.exports = WebSlackAuthRequest;
