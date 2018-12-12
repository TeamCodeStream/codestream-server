// provide service to handle asana credential authorization

'use strict';

const APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module.js');
const fetch = require('node-fetch');
const FS = require('fs');

class AsanaAuth extends APIServerModule {

	services () {
		return async () => {
			return { asanaAuth: this };
		};
	}

	async handleAuthRedirect (options) {
		const { request, provider, state } = options;
		const { config } = request.api;
		const { publicApiUrl, environment } = config.api;
		const { appClientId } = config.asana;
		const { response } = request;
		const parameters = {
			client_id: appClientId,
			redirect_uri: `${publicApiUrl}/no-auth/provider-token/${provider}/${environment}`,
			response_type: 'code',
			state
		};
		const query = Object.keys(parameters)
			.map(key => `${key}=${encodeURIComponent(parameters[key])}`)
			.join('&');
		response.redirect(`https://app.asana.com/-/oauth_authorize?${query}`);
		request.responseHandled = true;
	}

	async preProcessTokenCallback (options) {
		// must exchange the provided authorization code for an access token
		const { request, state, provider } = options;
		const { config } = request.api;
		const { publicApiUrl, environment } = config.api;
		const { appClientId, appClientSecret } = config.asana;
		const code = request.request.query.code || '';
		const parameters = {
			grant_type: 'authorization_code',
			client_id: appClientId,
			client_secret: appClientSecret,
			code,
			redirect_uri: `${publicApiUrl}/no-auth/provider-token/${provider}/${environment}`,
			state
		};
		const FormData = require('form-data');
		const form = new FormData();
		Object.keys(parameters).forEach(key => {
			form.append(key, parameters[key]/*encodeURIComponent(parameters[key])*/);
		});
		const url = 'https://app.asana.com/-/oauth_token';
		const response = await fetch(
			url,
			{
				method: 'post',
				body: form
			}
		);
		const responseData = await response.json();
		return { 
			accessToken: responseData.access_token,
			refreshToken: responseData.refresh_token,
			data: responseData.data
		};
	}

	getAfterAuthHtml () {
		return this.afterAuthHtml;
	}

	initialize () {
		this.afterAuthHtml = FS.readFileSync(this.path + '/afterAuth.html', { encoding: 'utf8' });
	}
}

module.exports = AsanaAuth;
