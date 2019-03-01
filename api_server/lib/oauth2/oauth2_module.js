// provide service to handle OAuth2 based authorization

'use strict';

const APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module.js');
const fetch = require('node-fetch');
const FormData = require('form-data');
const Base64 = require('base-64');

class OAuth2Module extends APIServerModule {

	services () {
		const { provider } = this.oauthConfig;
		if (!this.api.config[provider]) {
			this.api.warn(`No configuration for ${provider}, auth service will be unavailable`);
			return;
		}
		return async () => {
			return { [`${provider}Auth`]: this };
		};
	}

	// get redirect parameters and url to use in the redirect response
	getRedirectData (options) {
		const { provider, authPath, scopes, additionalAuthCodeParameters } = this.oauthConfig;
		const origin = options.origin || this.oauthConfig.appOrigin;
		const { redirectUri, state } = options;
		const config = this.api.config[provider];
		let appClientId;
		if (options.origin && config.enterpriseAppClientId) {
			appClientId = config.enterpriseAppClientId;
		}
		else {
			appClientId = config.appClientId;
		}
		const parameters = {
			client_id: appClientId,
			redirect_uri: redirectUri,
			response_type: 'code',
			state
		};
		if (scopes) {
			parameters.scope = scopes;
		}
		if (additionalAuthCodeParameters) {
			Object.assign(parameters, additionalAuthCodeParameters);
		}
		const url = `${origin}/${authPath}`;
		return { url, parameters };
	}
	
	// is an auth code for access token exchange required for this provider?
	exchangeRequired () {
		return !this.oauthConfig.noExchange;
	}

	// does this provider support token refresh?
	supportsRefresh () {
		return this.oauthConfig.supportsRefresh;
	}

	// given an auth code, exchange it for an access token
	async exchangeAuthCodeForToken (options) {
		const { mockToken } = options;
		const { tokenPath, exchangeFormat } = this.oauthConfig;
		const { appOrigin } = this.oauthConfig;
		const origin = options.origin || appOrigin;

		// must exchange the provided authorization code for an access token,
		// prepare parameters for the token exchange request
		const parameters = this.prepareTokenExchangeParameters(options);
		const url = `${origin}/${tokenPath}`;

		// for testing, we do a mock reply instead of an actual call out to the provider
		if (mockToken) {
			return this.makeMockData(url, parameters, mockToken);
		}

		// perform the exchange, which can be from form data, json data, or query
		let response;
		if (exchangeFormat === 'form') {
			response = await this.fetchAccessTokenWithFormData(url, parameters);
		}
		else if (exchangeFormat === 'query') {
			response = await this.fetchAccessTokenWithQuery(url, parameters);
		}
		else if (exchangeFormat === 'json') {
			response = await this.fetchAccessTokenWithJson(url, parameters);
		}
		const responseData = await response.json();

		// normalize and return the token data
		return this.normalizeTokenDataResponse(responseData);
	}

	// prepare parameters for token exchange
	prepareTokenExchangeParameters (options) {
		const { provider, appIdInAuthorizationHeader, noGrantType } = this.oauthConfig;
		const { state, code, redirectUri, refreshToken } = options;
		const config = this.api.config[provider];
		let appClientId, appClientSecret;
		if (options.origin && config.enterpriseAppClientId) {
			appClientId = config.enterpriseAppClientId;
			appClientSecret = config.enterpriseAppClientSecret;
		}
		else {
			appClientId = config.appClientId;
			appClientSecret = config.appClientSecret;
		}
		const parameters = {
			redirect_uri: redirectUri
		};
		if (!noGrantType) {
			parameters.grant_type = refreshToken ? 'refresh_token' : 'authorization_code';
		}
		if (appIdInAuthorizationHeader) {
			parameters.__userAuth = Base64.encode(`${appClientId}:${appClientSecret}`);
		}
		else {
			parameters.client_id = appClientId;
			parameters.client_secret = appClientSecret;
		}
		if (refreshToken) {
			parameters.refresh_token = refreshToken;
		}
		else {
			parameters.code = code;
			parameters.state = state;
		}
		return parameters;
	}

	// normalize the received response data after a token exchange
	normalizeTokenDataResponse (responseData) {
		const { accessTokenExpiresIn } = this.oauthConfig;
		if (responseData.error) {
			throw responseData;
		}
		const tokenData = {
			accessToken: responseData.access_token
		};
		if (responseData.refresh_token) {
			tokenData.refreshToken = responseData.refresh_token;
		}
		if (responseData.expires_in) {
			tokenData.expiresAt = Date.now() + (responseData.expires_in - 5) * 1000;
		}
		else if (accessTokenExpiresIn) {
			tokenData.expiresAt = Date.now() + (accessTokenExpiresIn - 5) * 1000;
		}
		const extraData = responseData.data || {};
		delete responseData.data;
		tokenData.data = Object.assign({}, responseData, extraData);
		delete tokenData.data.access_token;
		delete tokenData.data.refresh_token;
		return tokenData;
	}

	// make mock token data, instead of an actual call to the provider, for test purposes
	makeMockData (url, parameters, mockToken) {
		const { accessTokenExpiresIn, mockAccessTokenExpiresIn, exchangeFormat, supportsRefresh } = this.oauthConfig;
		const { __userAuth } = parameters;
		delete parameters.__userAuth;

		if (mockToken === 'error') {
			throw { error: 'invalid_grant' };
		}
		if (exchangeFormat === 'query') {
			const query = Object.keys(parameters)
				.map(key => `${key}=${encodeURIComponent(parameters[key])}`)
				.join('&');
			url += `?${query}`;
		}
		const testCall = { url, parameters };
		if (__userAuth) {
			testCall.userAuth = __userAuth;
		}
		const mockData = {
			accessToken: mockToken,
			_testCall: testCall
		};
		if (supportsRefresh) {
			mockData.refreshToken = 'refreshMe';
		}
		const expiresIn = mockAccessTokenExpiresIn || accessTokenExpiresIn;
		if (expiresIn) {
			mockData.expiresAt = Date.now() + (expiresIn - 5) * 1000;
		}
		return mockData;
	}

	// fetch access token data by submitting form data in a POST request
	async fetchAccessTokenWithFormData (url, parameters) {
		const { __userAuth } = parameters;
		delete parameters.__userAuth;

		const form = new FormData();
		Object.keys(parameters).forEach(key => {
			form.append(key, parameters[key]);
		});
		const fetchOptions = {
			method: 'post',
			body: form
		};
		if (__userAuth) {
			fetchOptions.headers = {
				'Authorization': `Basic ${__userAuth}`
			};
		}
		return await fetch(url, fetchOptions);
	}

	// fetch access token data by submitting a POST request with a query
	async fetchAccessTokenWithQuery (url, parameters) {
		const query = Object.keys(parameters)
			.map(key => `${key}=${encodeURIComponent(parameters[key])}`)
			.join('&');
		url += `?${query}`;
		return await fetch(
			url,
			{
				method: 'post',
				headers: { 'Accept': 'application/json' }
			}
		);
	}

	// fetch access token data by submitting a POST request with json data
	async fetchAccessTokenWithJson (url, parameters) {
		return await fetch(
			url,
			{
				method: 'post',
				body: JSON.stringify(parameters),
				headers: {
					'Content-Type': 'application/json'
				}
			}
		);
	}

	// use a refresh token to obtain a new access token
	async refreshToken (options) {
		return await this.exchangeAuthCodeForToken(options);
	}

	// get the page to land on once auth is complete
	getAuthCompletePage () {
		const { provider, authCompletePage } = this.oauthConfig;
		return authCompletePage || provider;
	}
}

module.exports = OAuth2Module;
