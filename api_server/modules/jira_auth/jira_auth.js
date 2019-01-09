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
			scope: 'read:jira-user read:jira-work write:jira-work offline_access',
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
		const { request, code, redirectUri, mockToken, refreshToken } = options;
		const { appClientId, appClientSecret } = request.api.config.jira;
		const parameters = {
			grant_type: refreshToken ? 'refresh_token' : 'authorization_code',
			client_id: appClientId,
			client_secret: appClientSecret
		};
		if (refreshToken) {
			parameters.refresh_token = refreshToken;
		}
		else {
			parameters.code = code;
			parameters.redirect_uri = redirectUri;
		}
		const url = 'https://auth.atlassian.com/oauth/token';
		if (mockToken) {
			if (mockToken === 'error') {
				throw { error: 'invalid_grant' };
			}
			return {
				accessToken: mockToken,
				refreshToken: 'refreshMe',
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
		if (responseData.error) {
			throw responseData;
		}
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
			data.refreshToken = responseData.refreshToken;
		}
		return data;
	}

	// use a refresh token to obtain a new access token
	async refreshToken (options) {
		return await this.exchangeAuthCodeForToken(options);
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
