// handle the "POST /no-auth/provider-auth" request to initiate user auth through a third-party provider

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request.js');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets');
const ErrorHandler = require(process.env.CS_API_TOP + '/server_utils/error_handler');

class ProviderAuthRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler = this.module.errorHandler;
	}

	async authorize () {
		// no authorization necessary, this just initiates a redirect to a third-party auth
		// connecting the current user
	}

	// process the request...
	async process () {

		try {
			// get the provider service corresponding to the passed provider
			this.provider = this.request.params.provider.toLowerCase();
			this.serviceAuth = this.api.services[`${this.provider}Auth`];
			if (!this.serviceAuth) {
				throw this.errorHandler.error('unknownProvider', { info: this.provider });
			}

			await this.requireAndAllow();	// require certain parameters, discard unknown parameters
			await this.extractFromAuthCode();	// extract the payload from the auth code
			if (this.request.query.host) {
				// if there is a host, we might need to get the host info based on the team
				await this.getTeam();
			}
			await this.getRequestToken();	// get request token, as needed (for OAuth 1.0)
			await this.performRedirect();	// perform whatever redirect is necessary to initiate the authorization
		}
		catch (error) {
			this.warn(ErrorHandler.log(error));
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			const code = typeof error === 'object' ? error.code : 'unknown';
			this.warn('Error handling provider auth request: ' + message);
			let url = `/web/error?code=${code}&provider=${this.provider}`;
			this.response.redirect(url);
			this.responseHandled = true;
		}
	}

	// require certain parameters, discard unknown parameters
	async requireAndAllow () {
		// mock token must be accompanied by secret
		if (this.request.query._mockToken && this.request.query._mockTokenSecret &&
			decodeURIComponent(this.request.query._secret || '') !== SecretsConfig.confirmationCheat) {
			this.warn('Deleting mock token because incorrect secret sent');
			delete this.request.query._mockToken;
			delete this.request.query._mockTokenSecret;
		}
		delete this.request.query._secret;

		await this.requireAllowParameters(
			'query',
			{
				required: {
					string: ['code']
				},
				optional: {
					string: ['host', '_mockToken', '_mockTokenSecret', 'sharing']
				}
			}
		);
	}

	// extract the payload from the auth code
	async extractFromAuthCode () {
		try {
			this.payload = this.api.services.tokenHandler.decode(this.request.query.code);
		}
		catch (error) {
			const message = typeof error === 'object' ? error.message : error;
			throw this.errorHandler.error('tokenInvalid', { reason: message });
		}
		if (this.payload.type !== 'pauth') {
			throw this.errorHandler.error('tokenInvalid', { reason: 'not a provider authorization token' });
		}
	}

	// get the team associated with the auth-code, in case we need to find enterprise-specific client info
	async getTeam () {
		this.team = await this.data.teams.getById(this.payload.teamId);
	}

	// get a request token, for modules implementing OAuth 1.0 (yuckers)
	async getRequestToken () {
		if (!this.serviceAuth.usesOauth1()) {
			return;
		}
		let { host, _mockToken, _mockTokenSecret } = this.request.query;
		const options = {
			request: this,
			host,
			team: this.team,
			mockToken: _mockToken,
			mockTokenSecret: _mockTokenSecret
		};
		this.requestTokenInfo = await this.serviceAuth.getRequestToken(options);
	}

	// response with a redirect to the third-party provider
	async performRedirect () {
		// for modules following OAuth 1.0....
		if (this.serviceAuth.usesOauth1()) {
			return await this.performOauth1Redirect();
		}

		// set up options for initiating a redirect for the particular service
		let { host } = this.request.query;
		const { code, access, sharing } = this.request.query;
		const { callbackEnvironment } = this.api.config.api;
		let { authOrigin } = this.api.config.api;

		// HACK - youtrack won't give us the state as a query parameter in the callback, it puts it in the fragment,
		// this means we can't proxy to the api server appropriate to the environment ... so bypass the proxy
		// entirely and go straight to the source ... this won't work for all providers because some only allow a
		// single redirect uri, which is sucky sucky
		if (this.provider === 'youtrack') {	
			authOrigin = `${this.api.config.api.publicApiUrl}/no-auth`;
		}

		let state = `${callbackEnvironment}!${code}`;
		if (host) {
			host = decodeURIComponent(host).toLowerCase();
			state += `!${host}`;
		}
		const redirectUri = `${authOrigin}/provider-token/${this.provider}`;
		const options = {
			state,
			request: this,
			redirectUri,
			host,
			team: this.team,
			access: access,
			sharing: sharing
		};

		// get the specific query data to use in the redirect, and response with the redirect url
		const { parameters, url } = this.serviceAuth.getRedirectData(options); 
		const query = Object.keys(parameters)
			.map(key => `${key}=${encodeURIComponent(parameters[key])}`)
			.join('&');
		this.response.redirect(`${url}?${query}`);
		this.responseHandled = true;
	}

	// perform an OAuth 1.0 redirect, for those modules that only support OAuth 1.0
	async performOauth1Redirect () {
		let { host } = this.request.query;
		const { code } = this.request.query;
		const { callbackEnvironment } = this.api.config.api;
		const authOrigin = `${this.api.config.api.publicApiUrl}/no-auth`;
		let state = `${callbackEnvironment}!${code}`;
		if (host) {
			host = decodeURIComponent(host).toLowerCase();
			state += `!${host}`;
		}
		const encodedSecret = this.api.services.tokenHandler.generate({
			sec: this.requestTokenInfo.oauthTokenSecret
		}, 'oasec');
		state += `!${encodedSecret}`;
		const callback = encodeURIComponent(`${authOrigin}/provider-token/${this.provider}?state=${state}`);
		const authorizePath = this.serviceAuth.getAuthorizePath();
		const clientInfo = this.serviceAuth.getClientInfo({ host, team: this.team, request: this });
		const url = `${clientInfo.host}/${authorizePath}?oauth_token=${this.requestTokenInfo.oauthToken}&oauth_callback=${callback}`;
		this.response.redirect(url);
		this.responseHandled = true;
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'provider-auth',
			summary: 'Initiates authorization with a third-party provider by returning the appropriate redirect',
			access: 'No authorization needed, this is essentially just a redirect to the third-party auth process',
			description: 'Provides the appropriate redirect response to initiate authorization against the given third-party provider; a temporary auth code is required, retrieved via the @@#provider-auth-code#provider-auth-code@@ request, to make this call',
			input: {
				summary: 'Specify the provider in the path, and an auth code, retrieved from the @@#provider-auth-code#provider-auth-code@@ request, in the query parameters',
				looksLike: {
					'code*': '<Temporary third-party auth code, retrieved from the @@#provider-auth-code#provider-auth-code@@ request>',
					'host': '<Redirect to this host instead of the standard one (eg. for on-premise versions), required for on-prem integrations>'
				}
			},
			returns: 'Redirects to the appropriate authorization page for the provider in question'
		};
	}
}

module.exports = ProviderAuthRequest;
