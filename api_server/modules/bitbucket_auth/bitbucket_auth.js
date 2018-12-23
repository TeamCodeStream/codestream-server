// provide service to handle bitbucket credential authorization

'use strict';

const APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module.js');
const fetch = require('node-fetch');
const FS = require('fs');
const FormData = require('form-data');
const Base64 = require('base-64');

class BitbucketAuth extends APIServerModule {

	services () {
		return async () => {
			return { bitbucketAuth: this };
		};
	}

	// get redirect parameters and url to use in the redirect response
	getRedirectData (options) {
		const { request, state, redirectUri } = options;
		const { appClientId } = request.api.config.bitbucket;
		const parameters = {
			client_id: appClientId,
			redirect_uri: redirectUri,
			scope: 'repository issue',
			state,
			response_type: 'code'
		};
		const url = 'https://bitbucket.org/site/oauth2/authorize';
		return { url, parameters };
	}

	// given an auth code, exchange it for an access token
	async exchangeAuthCodeForToken (options) {
		// must exchange the provided authorization code for an access token
		const { request, code, redirectUri, mockToken } = options;
		const { appClientId, appClientSecret } = request.api.config.bitbucket;
		const parameters = {
			code,
			grant_type: 'authorization_code',
			redirect_uri: redirectUri
		};
		const userAuth = Base64.encode(`${appClientId}:${appClientSecret}`);
		const url = 'https://bitbucket.org/site/oauth2/access_token';
		if (mockToken) {
			return {
				accessToken: mockToken,
				refreshToken: 'refreshMe',
				expiresAt: Date.now() + (119 * 60 * 1000 + 55 * 1000),
				_testCall: { url, parameters, userAuth }
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
				body: form,
				headers: {
					'Authorization': `Basic ${userAuth}`
				}
			}
		);
		const responseData = await response.json();
		const token = responseData.access_token;
		delete responseData.access_token;
		const data = { 
			accessToken: token,
			data: responseData
		};
		if (responseData.expires_in) {
			data.expiresAt = Date.now() + responseData.expires_in * 1000 - 5000;
		}
		if (responseData.refresh_token) {
			data.refreshToken = responseData.refresh_token;
			delete responseData.refresh_token;
		}
		return data;
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

module.exports = BitbucketAuth;
