// provide service to handle jira credential authorization

'use strict';

const APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module.js');
const fetch = require('node-fetch');
const FS = require('fs');

class JiraAuth extends APIServerModule {

	services () {
		return async () => {
			return { jiraAuth: this };
		};
	}

	// get redirect parameters and url to use in the redirect response
	getRedirectData (options) {
		const { request, state, redirectUri } = options;
		const { appClientId } = request.api.config.jira;
		const parameters = {
			audience: 'api.atlassian.com',
			client_id: appClientId,
			scope: 'read:jira-user read:jira-work write:jira-work',
			redirect_uri: redirectUri,
			response_type: 'code',
			prompt: 'consent',
			state
		};
		const url = 'https://auth.atlassian.com/authorize';
		return { url, parameters };
	}

	// given an auth code, exchange it for an access token
	async exchangeAuthCodeForToken (options) {
		// must exchange the provided authorization code for an access token
		const { request, code, redirectUri, mockToken } = options;
		const { appClientId, appClientSecret } = request.api.config.jira;
		const parameters = {
			grant_type: 'authorization_code',
			client_id: appClientId,
			client_secret: appClientSecret,
			code,
			redirect_uri: redirectUri
		};
		const url = 'https://auth.atlassian.com/oauth/token';
		if (mockToken) {
			return {
				accessToken: mockToken,
				expiresAt: Date.now() + 3600 * 1000,
				_testCall: { url, parameters }
			};
		}
		const response = await fetch(
			url,
			{
				method: 'post',
				body: JSON.stringify(parameters),
				headers: {
					'Content-Type': 'application/json'
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

module.exports = JiraAuth;
