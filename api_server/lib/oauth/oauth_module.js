// provide service to handle OAuth based authorization (either 1.0 or 2.0)

'use strict';

const APIServerModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/api_server/api_server_module.js');
const fetch = require('node-fetch');
const FormData = require('form-data');
const Base64 = require('base-64');
const OAuth = require('oauth').OAuth;

class OAuthModule extends APIServerModule {

	services () {
		const { provider } = this.oauthConfig;
		this.apiConfig = this.api.config.integrations[provider];
		// This should _never_ evaluate to true. If it does, we're missing defaults
		// for the provider in custom_config.js and you should definitely fix that!
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
		/*
		This use of "local providers" (on-prem providers created for the installation) is deprecated,
		but I'm keeping the code around in case we ever need to revisit
		if (this.apiConfig) {
			this.enterpriseConfig = this.apiConfig.localProviders;
		}
		*/
	}

	// get redirect parameters and url to use in the redirect response
	getRedirectData (options) {
		const { authPath, scopes, additionalAuthCodeParameters, scopeParameter } = this.oauthConfig;
		const clientInfo = this.getClientInfo(options);
		const { redirectUri, state } = options;
		const parameters = {
			client_id: clientInfo.clientId,
			redirect_uri: redirectUri,
			response_type: 'code',
			state
		};
		if (scopes) {
			const scopeParam = scopeParameter || 'scope';
			parameters[scopeParam] = scopes;
		}
		if (additionalAuthCodeParameters) {
			Object.assign(parameters, additionalAuthCodeParameters);
		}
		const url = `${clientInfo.host}/${authPath}`;
		return { url, parameters };
	}
	
	// get client info according to options and configuration, might be for the cloud-based
	// host, or for an enterprise on-premise instance
	getClientInfo (options) {
		const { provider, noClientIdOk } = this.oauthConfig;
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
				clientInfo = this.enterpriseConfig && this.enterpriseConfig[host];
				if (!clientInfo) {
					throw options.request.errorHandler.error('unknownProviderHost');
				}
			}
		}
		else {
			clientInfo = this.apiConfig;
		}

		if (!host) {
			const infoHost = options.forTokenExchange && this.oauthConfig.useApiHostForTokenExchange ? this.oauthConfig.apiHost : this.oauthConfig.host;
			host = options.hostUrl || `https://${infoHost}`; 
		}

		if (!noClientIdOk && (!clientInfo.appClientId || !clientInfo.appClientSecret)) {
			throw options.request.errorHandler.error('providerNotConfigured');
		}
		return {
			host,
			oauthData: clientInfo.oauthData,
			clientId: clientInfo.appClientId,
			clientSecret: clientInfo.appClientSecret,
		};
	}

	// does this module use OAuth 1.0 (OAuth 2.0 is the default) 
	usesOauth1 () {
		return this.oauthConfig.usesOauth1;
	}
	
	// return the path to use for the authorize step of OAuth 1.0
	getAuthorizePath () {
		return this.oauthConfig.authorizePath;
	}

	// is an auth code for access token exchange required for this provider?
	exchangeRequired () {
		return !this.oauthConfig.noExchange;
	}

	// does this provider support token refresh?
	supportsRefresh () {
		return this.oauthConfig.supportsRefresh;
	}
	
	// does this provider have issues?
	hasIssues () {
		return this.oauthConfig.hasIssues;
	}

	// does this provider support code hosting?
	hasCodeHosting () {
		return this.oauthConfig.hasCodeHosting;
	}

	// does this provider gets its token from a url fragment?
	tokenFromFragment () {
		return !!this.oauthConfig.tokenFromFragment;
	}

	// does this provider support signup?
	supportsSignup () {
		return this.oauthConfig.supportsSignup;
	}
	
	// extract the access token from a fragment sent to the browser
	extractTokenFromFragment (options) {
		// special allowance for token in the fragment, which we can't access,
		// so send a client script that can 
		const { provider, tokenFromFragment, additionalTokenValues } = this.oauthConfig;
		if (!tokenFromFragment) { return; }
		const { request, state, mockToken } = options;
		const { response } = request;
		const { authOrigin } = this.api.config.apiServer;
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
		const clientInfo = this.getClientInfo(Object.assign({}, options, { forTokenExchange: true }));

		// must exchange the provided authorization code for an access token,
		// prepare parameters for the token exchange request
		const parameters = this.prepareTokenExchangeParameters(options, clientInfo);
		const url = `${clientInfo.host}/${tokenPath}`;
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
		else if (exchangeFormat === 'formQuery') {
			response = await this.fetchAccessTokenWithFormQueryData(url, parameters);
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
		const { 
			appIdInAuthorizationHeader,
			noGrantType,
			additionalTokenParameters,
			additionalRefreshTokenParameters,
			secretParameterName,
			codeParameterName,
			refreshTokenParameterName
		} = this.oauthConfig;
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
			const secretKey = secretParameterName || 'client_secret';
			parameters[secretKey] = clientInfo.clientSecret;
		}
		if (refreshToken) {
			const refreshTokenKey = refreshTokenParameterName || 'refresh_token';
			parameters[refreshTokenKey] = refreshToken;
		}
		else {
			const codeKey = codeParameterName || 'code';
			parameters[codeKey] = code;
			parameters.state = state;
		}
		if (additionalTokenParameters) {
			Object.assign(parameters, additionalTokenParameters);
		}
		if (refreshToken && additionalRefreshTokenParameters) {
			Object.assign(parameters, additionalRefreshTokenParameters);
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
		if (responseData.apiKey) {
			tokenData.apiKey = responseData.apiKey;
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
		['access_token', 'refresh_token', 'state', 'code', '_mockToken'].forEach(prop => {
			delete tokenData.data[prop];
		});
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
		else if (mockToken === 'noToken') {
			mockToken = '';
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

	// fetch access token data by submitting form data in a POST request, with the data as a query string
	async fetchAccessTokenWithFormQueryData (url, parameters) {
		const { __userAuth } = parameters;
		delete parameters.__userAuth;

		const body = Object.keys(parameters).map(key => `${key}=${encodeURIComponent(parameters[key])}`).join('&');
		const fetchOptions = {
			method: 'post',
			body
		};
		fetchOptions.headers = {
			'Content-type': 'application/x-www-form-urlencoded'
		};
		if (__userAuth) {
			fetchOptions.headers['Authorization'] = `Basic ${__userAuth}`;
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
					'Accept': 'application/json',
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

	// get standard and enterprise instances linked to this third-party provider
	getInstances () {
		// get the standard instances, if configured
		const standardInstance = this.getStandardInstance();

		// get any instances of enterprise hosts given by configuration
		const instances = this.addInstancesByConfig(this.enterpriseConfig);

		if (standardInstance) {
			instances.push(standardInstance);
		}
		return instances;
	}

	// get the standard in-cloud instance of the third-party provider, if configured
	getStandardInstance (options = {}) {
		const { isOnPrem } = options;
		const { 
			host,
			provider,
			apiHost,
			hasIssues,
			hasCodeHosting,
			forEnterprise,
			needsConfigure,
			needsConfigureForOnPrem,
			supportsOAuthOrPAT,
			disabled,
			hasSharing,
			scopes
		} = this.oauthConfig;
		const { appClientId, apiKey } = this.apiConfig;
		const hasKey = appClientId || apiKey;
		if ((!disabled && host && hasKey) || (needsConfigureForOnPrem && isOnPrem)) {
			const starredHost = host.toLowerCase().replace(/\./g, '*');
			const info = {
				id: starredHost,
				name: provider,
				isEnterprise: false,
				forEnterprise,
				needsConfigure,
				needsConfigureForOnPrem,
				supportsOAuthOrPAT,
				host: host.toLowerCase(),
				apiHost: apiHost ? apiHost.toLowerCase() : undefined,
				hasIssues,
				hasCodeHosting,
				hasSharing
			};

			const parseScopes = scopes => {
				if (!scopes) return undefined;
				const scopes_comma = scopes.split(',');
				const scopes_space = scopes.split(' ');
				return scopes_comma.length > scopes_space.length ? scopes_comma : scopes_space;
			}
			info.scopes = parseScopes(scopes);
			return info;
		}
	}

	// get instances of provider hosts according to configuration passed in
	getInstancesByConfig (config) {
		const { provider, hasIssues, hasCodeHosting } = this.oauthConfig;
		const instances = [];
		Object.keys(config || {}).forEach(host => {
			const destarredHost = host.replace(/\*/g, '.');
			instances.push({
				id: host,
				name: provider,
				isEnterprise: true,
				host: destarredHost,
				hasIssues,
				hasCodeHosting,
				oauthData: config[host].oauthData
			});
		});
		return instances;
	}

	// fetch a request token for modules using OAuth 1.0
	getRequestToken (options) {
		const { mockToken, mockTokenSecret } = options;
		const oauthConsumer = this.initOauth1(options);
		return new Promise((resolve, reject) => {
			if (mockToken && mockTokenSecret) {
				return resolve({ oauthToken: mockToken, oauthTokenSecret: mockTokenSecret});
			}
			try {
				process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
				oauthConsumer.getOAuthRequestToken(
					(error, oauthToken, oauthTokenSecret) => {
						delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
						if (error) {
							const message = error instanceof Error ? error.message : JSON.stringify(error);
							const rejectError = options.request && options.request.errorHandler ?
								options.request.errorHandler.error('tokenInvalid', { reason: message }) : message;
							reject(rejectError);
						}
						else {
							resolve({ oauthToken, oauthTokenSecret });
						}
					}
				);
			}
			catch (error) {
				const message = error instanceof Error ? error.message : JSON.stringify(error);
				const rejectError = options.request && options.request.errorHandler ?
					options.request.errorHandler.error('tokenInvalid', { reason: message }) : message;
				reject(rejectError);
			}
		});
	}

	// fetch an access token for modules using OAuth 1.0, given an OAuth token obtained
	// from the provider-auth request
	async getOauth1AccessToken (options) {
		const oauthConsumer = this.initOauth1(options);
		return new Promise((resolve, reject) => {
			if (options.mockToken) {
				return resolve({ accessToken: options.mockToken, oauthTokenSecret: options.oauthTokenSecret });
			}
			process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
			oauthConsumer.getOAuthAccessToken(
				options.oauthToken,
				options.oauthTokenSecret,
				null,
				(error, accessToken) => {
					delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
					if (error) {
						error = options.request && options.request.errorHandler ?
							options.request.errorHandler.error('tokenInvalid') : error;
						reject(error);
					}
					else {
						resolve({ accessToken, oauthTokenSecret: options.oauthTokenSecret });
					}
				}
			);
		});
	}

	// init an OAuth 1.0 client for the given client options, as needed
	initOauth1 (options) {
		const clientInfo = this.getClientInfo(options);
		const { oauthData } = clientInfo;
		let { consumerKey, privateKey } = (oauthData || {});
		privateKey = (privateKey || '').trim();
		const match = privateKey.match(/^-----BEGIN ([A-Z]+) PRIVATE KEY-----(.+)-----END ([A-Z]+) PRIVATE KEY-----/s);
		if (match && match.length > 3) {
			const keyPart = match[2].replace(/\s+/g, '\n');
			privateKey = `-----BEGIN ${match[1]} PRIVATE KEY-----${keyPart}-----END ${match[3]} PRIVATE KEY-----\n`;
		}
		return new OAuth(
			`${clientInfo.host}/${this.oauthConfig.requestTokenPath}`,
			`${clientInfo.host}/${this.oauthConfig.accessTokenPath}`,
			consumerKey,
			privateKey,
			'1.0',
			null,
			'RSA-SHA1',
			null,
			null
		);
	}

	// if provider supports multiple authorizations (multiple access tokens), override this
	async getMultiAuthExtraData () {
		return undefined;
	}

	async getUserId () {
		return undefined;
	}
}

module.exports = OAuthModule;
