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

	async handleAuthRedirect (options) {
		const { request, provider, state } = options;
		const { config } = request.api;
		const { authOrigin } = config.api;
		const { appClientId } = config.github;
		const { response } = request;
		const parameters = {
			client_id: appClientId,
			redirect_uri: `${authOrigin}/provider-token/${provider}`,
			scope: 'repo,user',
			state
		};
		const query = Object.keys(parameters)
			.map(key => `${key}=${encodeURIComponent(parameters[key])}`)
			.join('&');
		response.redirect(`https://github.com/login/oauth/authorize?${query}`);
		request.responseHandled = true;
	}

	async preProcessTokenCallback (options) {
		// must exchange the provided authorization code for an access token
		const { request, state, provider } = options;
		const { config } = request.api;
		const { authOrigin } = config.api;
		const { appClientId, appClientSecret } = config.github;
		const code = request.request.query.code || '';
		const parameters = {
			client_id: appClientId,
			client_secret: appClientSecret,
			code,
			redirect_uri: `${authOrigin}/provider-token/${provider}`,
			state
		};
		const query = Object.keys(parameters)
			.map(key => `${key}=${encodeURIComponent(parameters[key])}`)
			.join('&');
		const url = `https://github.com/login/oauth/access_token?${query}`;
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

	getAfterAuthHtml () {
		return this.afterAuthHtml;
	}

	initialize () {
		this.afterAuthHtml = FS.readFileSync(this.path + '/afterAuth.html', { encoding: 'utf8' });
	}
}

module.exports = GithubAuth;
