// handle the "POST /no-auth/provider-auth" request to initiate user auth through a third-party provider

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request.js');
const Errors = require('./errors');

class ProviderAuthRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(Errors);
	}

	async authorize () {
		// no authorization necessary, this just initiates a redirect to a third-party auth
		// connecting the current user
	}

	// process the request...
	async process () {
		await this.requireAndAllow();	// require certain parameters, discard unknown parameters
		if (this.request.query.host) {
			// if there is a host, we might need to get the host info based on the team
			await this.getTeam();
		}
		await this.performRedirect();	// perform whatever redirect is necessary to initiate the authorization
	}

	// require certain parameters, discard unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters(
			'query',
			{
				required: {
					string: ['code']
				},
				optional: {
					string: ['host']
				}
			}
		);
	}

	// get the team associated with the auth-code, in case we need to find enterprise-specific client info
	async getTeam () {
		let payload;
		try {
			payload = this.api.services.tokenHandler.decode(this.request.query.code);
		}
		catch (error) {
			const message = typeof error === 'object' ? error.message : error;
			throw this.errorHandler.error('tokenInvalid', { reason: message });
		}
		if (payload.type !== 'pauth') {
			throw this.errorHandler.error('tokenInvalid', { reason: 'not a provider authorization token' });
		}
		this.team = await this.data.teams.getById(payload.teamId);
	}

	// response with a redirect to the third-party provider
	async performRedirect () {
		// get the provider service corresponding to the passed provider
		this.provider = this.request.params.provider.toLowerCase();
		this.serviceAuth = this.api.services[`${this.provider}Auth`];
		if (!this.serviceAuth) {
			throw this.errorHandler.error('unknownProvider', { info: this.provider });
		}

		// set up options for initiating a redirect for the particular service
		let { host } = this.request.query;
		const { code } = this.request.query;
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
			provider: this.provider,
			request: this,
			redirectUri,
			host,
			team: this.team
		};

		// get the specific query data to use in the redirect, and response with the redirect url
		const { parameters, url } = this.serviceAuth.getRedirectData(options); 
		const query = Object.keys(parameters)
			.map(key => `${key}=${encodeURIComponent(parameters[key])}`)
			.join('&');
		this.response.redirect(`${url}?${query}`);
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
