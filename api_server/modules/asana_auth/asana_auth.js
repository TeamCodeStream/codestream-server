// provide service to handle asana credential authorization

'use strict';

const APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module.js');
const fetch = require('node-fetch');
const FS = require('fs');
const FormData = require('form-data');

class AsanaAuth extends APIServerModule {

	services () {
		return async () => {
			return { asanaAuth: this };
		};
	}

	// get redirect parameters and url to use in the redirect response
	getRedirectData (options) {
		const { request, redirectUri, state } = options;
		const { appClientId } = request.api.config.asana;
		const parameters = {
			client_id: appClientId,
			redirect_uri: redirectUri,
			response_type: 'code',
			state
		};
		const url = 'https://app.asana.com/-/oauth_authorize';
		return { url, parameters };
	}

	// given an auth code, exchange it for an access token
	async exchangeAuthCodeForToken (options) {
		// must exchange the provided authorization code for an access token
		const { request, state, code, redirectUri, mockToken } = options;
		const { appClientId, appClientSecret } = request.api.config.asana;
		const parameters = {
			grant_type: 'authorization_code',
			client_id: appClientId,
			client_secret: appClientSecret,
			code,
			redirect_uri: redirectUri,
			state
		};
		const expiresAt = Date.now() + (59 * 60 * 1000 + 55 * 1000);	// token good for one hour, we'll give a 5-second margin
		const url = 'https://app.asana.com/-/oauth_token';
		if (mockToken) {
			return {
				accessToken: mockToken,
				refreshToken: 'refreshMe',
				expiresAt,
				_testCall: { url, parameters }
			};
		}
		const form = new FormData();
		Object.keys(parameters).forEach(key => {
			form.append(key, parameters[key]);
		});
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
			expiresAt,
			data: responseData.data
		};
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

module.exports = AsanaAuth;
