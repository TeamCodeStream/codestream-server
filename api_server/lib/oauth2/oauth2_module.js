// provide service to handle OAuth2 based authorization

'use strict';

const APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module.js');
const fetch = require('node-fetch');
const FormData = require('form-data');
const Base64 = require('base-64');

class OAuth2Module extends APIServerModule {

	services () {
		const { provider } = this.oauthConfig;
		this.apiConfig = this.api.config[provider];
		if (!this.apiConfig) {
			this.api.warn(`No configuration for ${provider}, auth service will be unavailable`);
			return;
		}
		this.enterpriseConfig = {};
		return async () => {
			return { [`${provider}Auth`]: this };
		};
	}

	async initialize () {
		const { enterpriseConfigFile } = this.apiConfig;
		const { provider } = this.oauthConfig;
		if (!enterpriseConfigFile) {
			return;
		}
		try {
			this.enterpriseConfig = require(enterpriseConfigFile);
		}
		catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			this.api.warn(`Unable to load enterprise configuration file for ${provider}: ${message}`);
		}
	}

	// get redirect parameters and url to use in the redirect response
	getRedirectData (options) {
		const { authPath, scopes, additionalAuthCodeParameters } = this.oauthConfig;
		const clientInfo = this.getClientInfo(options);
		const { redirectUri, state } = options;
		const parameters = {
			client_id: clientInfo.clientId,
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
		const url = `https://${clientInfo.host}/${authPath}`;
		return { url, parameters };
	}
	
	// get client info according to options and configuration, might be for the cloud-based
	// host, or for an enterprise on-premise instance
	getClientInfo (options) {
		const { provider } = this.oauthConfig;
		let { host } = options;
		let clientInfo;
		if (host) {
			host = host.toLowerCase();
		}
		if (host) {
			const starredHost = host.replace(/\./g, '*');
			if (
				options.team && 
				options.team.get('providerHosts') && 
				options.team.get('providerHosts')[provider] &&
				options.team.get('providerHosts')[provider][starredHost]
			) {
				clientInfo = options.team.get('providerHosts')[provider][starredHost];
			}
			if (!clientInfo) {
				clientInfo = this.enterpriseConfig[host];
				if (!clientInfo) {
					throw options.request.errorHandler.error('unknownProviderHost');
				}
			}
		}
		else {
			clientInfo = this.apiConfig;
		}
		return {
			host: host || this.oauthConfig.host,
			clientId: clientInfo.appClientId,
			clientSecret: clientInfo.appClientSecret
		};
	}

	// is an auth code for access token exchange required for this provider?
	exchangeRequired () {
		return !this.oauthConfig.noExchange;
	}

	// does this provider support token refresh?
	supportsRefresh () {
		return this.oauthConfig.supportsRefresh;
	}

	// does this provider gets its token from a url fragment?
	tokenFromFragment () {
		return !!this.oauthConfig.tokenFromFragment;
	}

	// extract the access token from a fragment sent to the browser
	extractTokenFromFragment (options) {
		// special allowance for token in the fragment, which we can't access,
		// so send a client script that can 
		const { provider, tokenFromFragment, additionalTokenValues } = this.oauthConfig;
		if (!tokenFromFragment) { return; }
		const { request, state, mockToken } = options;
		const { response } = request;
		const { authOrigin } = this.api.config.api;
		let tokenParams = {};
		if (mockToken || request.request.query.token) {
			if (mockToken) {
				tokenParams.access_token = mockToken;
			}
			else if (request.request.query.token) {
				// already have the token, so good to go 
				tokenParams.access_token = request.request.query.token;
			}
			(additionalTokenValues || []).forEach(value => {
				if (this.apiConfig[value]) {
					tokenParams[value] = this.apiConfig[value];
				}
				else if (this.oauthConfig[value]) {
					tokenParams[value] = this.oauthConfig[value];
				}
			});
			return tokenParams;
		}
		response.type('text/html');
		response.send(`
<script>
	var hash = window.location.hash.substr(1);
	var hashObject = hash.split('&').reduce(function (result, item) {
		var parts = item.split('=');
		result[parts[0]] = parts[1];
		return result;
	}, {});
	const token = hashObject['${tokenFromFragment}'] || '';
	let state = "${state}";
	if (!state) {
		state = hashObject.state;
	}
	let href;
	if (!token) {
		href = "${authOrigin}/provider-token/${provider}?error=NO_TOKEN";
	}
	else {
		href = "${authOrigin}/provider-token/${provider}?" + hash;
		if (!hashObject.token) {
			href += "&token=" + token;
		}
	}
	if (!hashObject.state) {
		href += "&state=" + state;
	}
	document.location.href = href;
</script>
`
		);
		request.responseHandled = true;
		return false;	// indicates to stop further processing
	}

	// given an auth code, exchange it for an access token
	async exchangeAuthCodeForToken (options) {
		const { mockToken } = options;
		const { tokenPath, exchangeFormat } = this.oauthConfig;
		const clientInfo = this.getClientInfo(options);

		// must exchange the provided authorization code for an access token,
		// prepare parameters for the token exchange request
		const parameters = this.prepareTokenExchangeParameters(options, clientInfo);
		const url = `https://${clientInfo.host}/${tokenPath}`;

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
	prepareTokenExchangeParameters (options, clientInfo) {
		const { appIdInAuthorizationHeader, noGrantType } = this.oauthConfig;
		const { state, code, redirectUri, refreshToken } = options;
		const parameters = {
			redirect_uri: redirectUri
		};
		if (!noGrantType) {
			parameters.grant_type = refreshToken ? 'refresh_token' : 'authorization_code';
		}
		if (appIdInAuthorizationHeader) {
			parameters.__userAuth = Base64.encode(`${clientInfo.clientId}:${clientInfo.clientSecret}`);
		}
		else {
			parameters.client_id = clientInfo.clientId;
			parameters.client_secret = clientInfo.clientSecret;
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

	// return the instances of this provider (public instance, plus and on-premise instances)
	getInstances (teams = []) {
		const { provider } = this.oauthConfig;

		// get base instances of all providers without enterprise hosts
		const instances = {};
		if (this.oauthConfig.host && (this.apiConfig.appClientId || this.apiConfig.apiKey)) {
			const host = this.oauthConfig.host.toLowerCase();
			const apiHost = this.oauthConfig.apiHost.toLowerCase();
			instances[host] = {
				public: true,
				host,
				apiHost,
				hasIssues: this.oauthConfig.hasIssues
			};
		}

		// get any instances of enterprise hosts given by configuration
		this.addInstancesByConfig(instances, this.enterpriseConfig);

		// get any instances of enterprise hosts given by team
		teams.forEach(team => {
			const hosts = (team.get('providerHosts') || {})[provider];
			this.addInstancesByConfig(instances, hosts, team.id);
		});

		return Object.keys(instances).length ? instances : null;
	}

	// add instances of provider hosts according to configuration passed in
	addInstancesByConfig (instances, config, teamId) {
		Object.keys(config || {}).forEach(host => {
			const destarredHost = host.replace(/\*/g, '.');
			instances[destarredHost] = {
				public: false,
				host: destarredHost,
				hasIssues: this.oauthConfig.hasIssues,
				teamId
			};
		});
	}
}

module.exports = OAuth2Module;
