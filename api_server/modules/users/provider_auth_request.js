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
		await this.performRedirect();	// perform whatever redirect is necessary to initiate the authorization
	}

	// require certain parameters, discard unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters(
			'query',
			{
				required: {
					string: ['code']
				}
			}
		);
	}

	// response with a redirect to the third-party provider
	async performRedirect () {
		// get the provider service corresponding to the passed provider
		this.provider = this.request.params.provider.toLowerCase();
		let serviceAuth = {
			trello: 'trelloAuth',
			github: 'githubAuth',
			asana: 'asanaAuth',
			jira: 'jiraAuth'
		}[this.provider];
		if (!serviceAuth || !this.api.services[serviceAuth]) {
			throw this.errorHandler.error('unknownProvider', { info: this.provider });
		}

		// set up options for initiating a redirect for the particular service
		const { authOrigin, callbackEnvironment } = this.api.config.api;
		const { code } = this.request.query;
		const state = `${callbackEnvironment}!${code}`;
		const redirectUri = `${authOrigin}/provider-token/${this.provider}`;
		const options = {
			state,
			provider: this.provider,
			request: this,
			redirectUri
		};

		// get the specific query data to use in the redirect, and response with the redirect url
		const { parameters, url } = this.api.services[serviceAuth].getRedirectData(options); 
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
					code: '<Temporary third-party auth code, retrieved from the @@#provider-auth-code#provider-auth-code@@ request>'
				}
			},
			returns: 'Redirects to the appropriate authorization page for the provider in question'
		};
	}
}

module.exports = ProviderAuthRequest;
