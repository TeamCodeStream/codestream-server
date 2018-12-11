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
		await this.requireAndAllow();		// require certain parameters, discard unknown parameters
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
					string: ['key', 'expiresIn']
				}
			}
		);
	}

	async performRedirect () {
		this.provider = this.request.params.provider.toLowerCase();
		switch (this.provider) {
		case 'trello':
			return await this.trelloRedirect();
		default: 
			throw this.errorHandler.error('unknownProvider', { info: this.provider });
		}

	}

	// perform redirect for trello auth
	async trelloRedirect () {
		// FIXME ... this is my (colin's) key!!!
		const key = this.request.query.key || 'e19498416be875ef9078ec7751bbce7e';
		const state = this.request.query.code;
		const host = this.api.config.api.host;
		const port = this.api.config.express.port;
		const parameters = {
			expiration: 'never',
			name: 'CodeStream',
			scope: 'read,write',
			response_type: 'token',
			key,
			callback_method: 'fragment',
			return_url: `https://${host}:${port}/no-auth/provider-token/trello?state=${state}`
		};
		const query = Object.keys(parameters)
			.map(key => `${key}=${encodeURIComponent(parameters[key])}`)
			.join('&');
		this.response.redirect(`https://trello.com/1/authorize?${query}`);
		this.responseHandled = true;
	}

	// generate a state token based on the passed payload
	async generateStateToken (payload) {
		// time till expiration can be provided (normally for testing purposes),
		// or default to configuration
		let expiresIn = 10 * 60 * 1000;
		const requestExpiresIn = this.request.query.expiresIn ? parseInt(this.request.query.expiresIn, 10) : null;
		if (requestExpiresIn && requestExpiresIn < expiresIn) {
			this.warn('Overriding configured provider auth token expiration to ' + requestExpiresIn);
			expiresIn = requestExpiresIn;
		}
		const expiresAt = Date.now() + expiresIn;
		return this.api.services.tokenHandler.generate(
			payload,
			'pauth',
			{ expiresAt }
		);
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'provider-auth',
			summary: 'Initiates authorization with a third-party provider',
			access: 'No authorization needed, this is essentially just a redirect to the third-party auth process',
			description: 'Provide the appropriate redirect response to initiate authorization against the given third-party provider',
			input: 'Specify the provider in the path',
			returns: 'Redirects to the appropriate authorization page for the provider in question'
		};
	}
}

module.exports = ProviderAuthRequest;
