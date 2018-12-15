// provide service to handle github credential authorization

'use strict';

const APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module.js');
const fetch = require('node-fetch');
const FS = require('fs');

class GithubAuth extends APIServerModule {

	services () {
		return async () => {
			return { githubAuth: this };
		};
	}

	// get redirect parameters and url to use in the redirect response
	getRedirectData (options) {
		const { request, state, redirectUri } = options;
		const { appClientId } = request.api.config.github;
		const parameters = {
			client_id: appClientId,
			redirect_uri: redirectUri,
			scope: 'repo,user',
			state
		};
		const url = 'https://github.com/login/oauth/authorize';
		return { url, parameters };
	}

	// given an auth code, exchange it for an access token
	async exchangeAuthCodeForToken (options) {
		// must exchange the provided authorization code for an access token
		const { request, state, code, redirectUri, mockToken } = options;
		const { appClientId, appClientSecret } = request.api.config.github;
		const parameters = {
			client_id: appClientId,
			client_secret: appClientSecret,
			code,
			redirect_uri: redirectUri,
			state
		};
		const query = Object.keys(parameters)
			.map(key => `${key}=${encodeURIComponent(parameters[key])}`)
			.join('&');
		const url = `https://github.com/login/oauth/access_token?${query}`;
		if (mockToken) {
			return {
				accessToken: mockToken,
				_testCall: { url, parameters }
			};
		}
		const response = await fetch(
			url,
			{
				method: 'post',
				headers: { 'Accept': 'application/json' }
			}
		);
		const responseData = await response.json();
		return { accessToken: responseData.access_token };
	}

	// get html to display once auth is complete
	getAfterAuthHtml () {
		return this.afterAuthHtml;
	}

	// initialize the module
	initialize () {
		// read in the after-auth html to display once auth is complete
		this.afterAuthHtml = FS.readFileSync(this.path + '/afterAuth.html', { encoding: 'utf8' });
	}
}

module.exports = GithubAuth;
